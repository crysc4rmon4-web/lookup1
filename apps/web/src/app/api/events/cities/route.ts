import { NextResponse } from "next/server";
import { municipalityCatalog } from "@/lib/locations/spain-municipality-catalog";
import { normalizeLocationSearch } from "@/lib/locations/spain-locations";

export function GET(request: Request) {
  const query = normalizeLocationSearch(new URL(request.url).searchParams.get("q") ?? "")
    .replace(/\b(capital|municipio|provincia)\b/g, "").replace(/\s+/g, " ").trim();
  if (query.length < 2 || query.length > 120) return NextResponse.json({ cities: [] });
  const words = query.split(" ");
  const cities = municipalityCatalog
    .filter((city) => words.some((word) => city.searchKey.includes(word)) &&
      words.every((word) => (city.searchKey + " " + city.provinceSearchKey).includes(word)))
    .sort((a, b) => Number(b.searchKey === query) - Number(a.searchKey === query) ||
      Number(b.searchKey.startsWith(query)) - Number(a.searchKey.startsWith(query)) || a.name.localeCompare(b.name, "es"))
    .slice(0, 12)
    .map(({ id, name, province, provinceCode }) => ({ id, name, province, provinceCode }));
  return NextResponse.json({ cities }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
