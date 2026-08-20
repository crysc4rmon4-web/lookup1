export type SpainProvince = {
  code: string;
  name: string;
  searchKey: string;
  municipalityCount: number;
};

export type SpainMunicipality = {
  code: string;
  ineCode: string;
  ineCodeWithCheck: string;
  checkDigit: string;
  name: string;
  searchKey: string;
};

type MunicipalitiesPayload = {
  province: {
    code: string;
    name: string;
    searchKey: string;
  };
  municipalities: SpainMunicipality[];
};

export async function getSpainProvinces(): Promise<
  SpainProvince[]
> {
  const response = await fetch(
    "/data/locations/es/provinces.json",
    {
      cache: "force-cache",
    },
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo cargar el catálogo de provincias.",
    );
  }

  return (await response.json()) as SpainProvince[];
}

export async function getSpainMunicipalities(
  provinceCode: string,
): Promise<SpainMunicipality[]> {
  const normalizedCode = provinceCode
    .trim()
    .padStart(2, "0");

  if (!/^\d{2}$/.test(normalizedCode)) {
    throw new Error(
      "Código de provincia no válido.",
    );
  }

  const response = await fetch(
    `/data/locations/es/municipalities/${normalizedCode}.json`,
    {
      cache: "force-cache",
    },
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo cargar el catálogo de municipios.",
    );
  }

  const payload =
    (await response.json()) as MunicipalitiesPayload;

  return payload.municipalities;
}

export function normalizeLocationSearch(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}