from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

import json
import re
import sys
import unicodedata


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
}

SOURCE_URL = "https://www.ine.es/daco/daco42/codmun/26codmun.xlsx"
EFFECTIVE_DATE = "2026-01-01"

OUTPUT_ROOT = Path(
    "apps/web/public/data/locations/es"
)

MUNICIPALITIES_DIR = (
    OUTPUT_ROOT / "municipalities"
)


def normalize_search_key(
    value: str,
) -> str:
    normalized = unicodedata.normalize(
        "NFKD",
        value,
    )

    without_accents = "".join(
        char
        for char in normalized
        if not unicodedata.combining(char)
    )

    return re.sub(
        r"[^a-z0-9]+",
        " ",
        without_accents.lower(),
    ).strip()


def get_shared_strings(
    archive: ZipFile,
) -> list[str]:
    path = "xl/sharedStrings.xml"

    if path not in archive.namelist():
        return []

    root = ET.fromstring(
        archive.read(path)
    )

    values: list[str] = []

    for item in root.findall(
        "main:si",
        NS,
    ):
        text = "".join(
            node.text or ""
            for node in item.findall(
                ".//main:t",
                NS,
            )
        )

        values.append(text)

    return values


def get_cell_value(
    cell: ET.Element,
    shared_strings: list[str],
) -> str:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        return "".join(
            node.text or ""
            for node in cell.findall(
                ".//main:t",
                NS,
            )
        ).strip()

    value_node = cell.find(
        "main:v",
        NS,
    )

    if value_node is None:
        return ""

    raw_value = (
        value_node.text or ""
    ).strip()

    if (
        cell_type == "s"
        and raw_value.isdigit()
    ):
        index = int(raw_value)

        if (
            0 <= index <
            len(shared_strings)
        ):
            return shared_strings[
                index
            ].strip()

    return raw_value


def get_column_index(
    reference: str,
) -> int:
    match = re.match(
        r"([A-Z]+)",
        reference,
    )

    if not match:
        return 0

    result = 0

    for char in match.group(1):
        result = (
            result * 26
            + ord(char)
            - ord("A")
            + 1
        )

    return result - 1


def extract_rows(
    xlsx_path: Path,
) -> list[list[str]]:
    with ZipFile(xlsx_path) as archive:
        shared_strings = get_shared_strings(
            archive,
        )

        worksheet_paths = [
            path
            for path in archive.namelist()
            if re.fullmatch(
                r"xl/worksheets/sheet\d+\.xml",
                path,
            )
        ]

        worksheet_paths.sort(
            key=lambda path: int(
                re.search(
                    r"sheet(\d+)\.xml",
                    path,
                ).group(1)
            )
        )

        if not worksheet_paths:
            raise RuntimeError(
                "El Excel no contiene hojas legibles."
            )

        rows: list[list[str]] = []

        for worksheet_path in worksheet_paths:
            root = ET.fromstring(
                archive.read(
                    worksheet_path,
                )
            )

            for row in root.findall(
                ".//main:sheetData/main:row",
                NS,
            ):
                cells: dict[int, str] = {}

                for cell in row.findall(
                    "main:c",
                    NS,
                ):
                    reference = (
                        cell.attrib.get("r")
                        or "A1"
                    )

                    index = get_column_index(
                        reference,
                    )

                    cells[index] = get_cell_value(
                        cell,
                        shared_strings,
                    )

                if not cells:
                    continue

                last_index = max(
                    cells.keys()
                )

                values = [
                    cells.get(
                        index,
                        "",
                    )
                    for index in range(
                        last_index + 1
                    )
                ]

                rows.append(values)

        return rows


def generate(
    xlsx_path: Path,
) -> None:
    if not xlsx_path.exists():
        raise FileNotFoundError(
            f"No existe {xlsx_path}"
        )

    rows = extract_rows(
        xlsx_path,
    )

    provinces: dict[
        str,
        dict[str, object],
    ] = {}

    current_province_name: (
        str | None
    ) = None

    for row in rows:
        cleaned = [
            value.strip()
            for value in row
        ]

        non_empty = [
            value
            for value in cleaned
            if value
        ]

        if not non_empty:
            continue

        # Cabeceras provinciales del INE.
        if len(non_empty) == 1:
            candidate = non_empty[0]

            if (
                not candidate.lower().startswith(
                    "relación de municipios"
                )
                and candidate != "NOMBRE"
            ):
                current_province_name = (
                    candidate
                )

            continue

        if len(cleaned) < 4:
            continue

        province_code_raw = (
            cleaned[0]
        )

        municipality_code_raw = (
            cleaned[1]
        )

        check_digit_raw = (
            cleaned[2]
        )

        municipality_name = (
            cleaned[3]
        )

        if (
            not re.fullmatch(
                r"\d{1,2}",
                province_code_raw,
            )
            or not re.fullmatch(
                r"\d{1,3}",
                municipality_code_raw,
            )
            or not re.fullmatch(
                r"\d",
                check_digit_raw,
            )
            or not municipality_name
        ):
            continue

        if not current_province_name:
            raise RuntimeError(
                "Se encontró un municipio "
                "sin provincia asociada."
            )

        province_code = (
            province_code_raw.zfill(2)
        )

        municipality_code = (
            municipality_code_raw.zfill(3)
        )

        check_digit = (
            check_digit_raw
        )

        province = provinces.setdefault(
            province_code,
            {
                "name":
                    current_province_name,
                "municipalities":
                    [],
            },
        )

        municipalities = province[
            "municipalities"
        ]

        assert isinstance(
            municipalities,
            list,
        )

        municipalities.append(
            {
                "code":
                    municipality_code,

                "ineCode":
                    (
                        province_code
                        + municipality_code
                    ),

                "ineCodeWithCheck":
                    (
                        province_code
                        + municipality_code
                        + check_digit
                    ),

                "checkDigit":
                    check_digit,

                "name":
                    municipality_name,

                "searchKey":
                    normalize_search_key(
                        municipality_name,
                    ),
            }
        )

    if not provinces:
        raise RuntimeError(
            "No se encontraron municipios "
            "en el fichero del INE."
        )

    OUTPUT_ROOT.mkdir(
        parents=True,
        exist_ok=True,
    )

    MUNICIPALITIES_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    province_index: list[
        dict[str, object]
    ] = []

    total_municipalities = 0

    for province_code in sorted(
        provinces,
        key=int,
    ):
        province = provinces[
            province_code
        ]

        province_name = str(
            province["name"]
        )

        municipalities = province[
            "municipalities"
        ]

        assert isinstance(
            municipalities,
            list,
        )

        municipalities.sort(
            key=lambda item:
                normalize_search_key(
                    str(item["name"])
                )
        )

        total_municipalities += len(
            municipalities
        )

        province_index.append(
            {
                "code":
                    province_code,

                "name":
                    province_name,

                "searchKey":
                    normalize_search_key(
                        province_name,
                    ),

                "municipalityCount":
                    len(
                        municipalities
                    ),
            }
        )

        payload = {
            "province": {
                "code":
                    province_code,

                "name":
                    province_name,

                "searchKey":
                    normalize_search_key(
                        province_name,
                    ),
            },

            "municipalities":
                municipalities,
        }

        output_path = (
            MUNICIPALITIES_DIR
            / f"{province_code}.json"
        )

        output_path.write_text(
            json.dumps(
                payload,
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    (
        OUTPUT_ROOT
        / "provinces.json"
    ).write_text(
        json.dumps(
            province_index,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    metadata = {
        "countryCode": "ES",
        "countryName": "España",
        "source": "INE",
        "sourceUrl": SOURCE_URL,
        "effectiveDate":
            EFFECTIVE_DATE,
        "generatedAt":
            datetime.now(
                timezone.utc,
            ).isoformat(),
        "provinceCount":
            len(
                province_index
            ),
        "municipalityCount":
            total_municipalities,
    }

    (
        OUTPUT_ROOT
        / "meta.json"
    ).write_text(
        json.dumps(
            metadata,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        "✅ Catálogo territorial generado"
    )

    print(
        f"Provincias/territorios: "
        f"{len(province_index)}"
    )

    print(
        f"Municipios: "
        f"{total_municipalities}"
    )

    print(
        f"Destino: {OUTPUT_ROOT}"
    )


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(
            "Uso: python "
            "scripts/generate-spain-locations.py "
            "/ruta/26codmun.xlsx"
        )

    generate(
        Path(
            sys.argv[1]
        )
    )


if __name__ == "__main__":
    main()
