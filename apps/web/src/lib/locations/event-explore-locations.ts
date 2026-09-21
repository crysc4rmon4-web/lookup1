import islands from "./spain-islands.json";
import { municipalityCatalog } from "./spain-municipality-catalog";
import { getLocationNames, locationNamesMatch } from "./location-name";
import { normalizeLocationSearch } from "./spain-locations";

export type ExploreLocationChoice = {
  id: string;
  kind: "municipality" | "island";
  name: string;
  province: string;
  provinceCode: string;
  center?: { latitude: number; longitude: number; zoom: number };
};
type Bounds = { south: number; north: number; west: number; east: number };
type ExploreLocation = ExploreLocationChoice & {
  municipalityIds: string[];
  aliases: string[];
  bounds?: Bounds;
  excludeBounds?: Bounds;
};

// Municipal membership: INE 2026, https://www.ine.es/daco/daco42/codmun/26codislas.xlsx
// Centers are approximate initial viewports, never event positions.
const centers: Record<string, [number, number, number]> = {
  "071": [38.70, 1.45, 11], "072": [38.98, 1.42, 10],
  "073": [39.65, 2.99, 9], "074": [39.96, 4.08, 10],
  "351": [28.40, -14.00, 9], "352": [27.96, -15.59, 10],
  "353": [29.04, -13.63, 10], "381": [28.11, -17.24, 11],
  "382": [27.74, -18.00, 11], "383": [28.68, -17.85, 10],
  "384": [28.29, -16.57, 9],
};
// OSM island extents, checked 2026-09-21. These islands share a municipality
// with a larger island; coordinates distinguish them without changing stored events.
const graciosa: Bounds = { south: 29.2165667, north: 29.2908860, west: -13.5487921, east: -13.4719480 };
const cabrera: Bounds = { south: 39.1250340, north: 39.1656628, west: 2.9141704, east: 2.9764936 };

const islandLocations: ExploreLocation[] = islands.map((island) => {
  const province = municipalityCatalog.find((city) => city.provinceCode === island.province)!;
  const [latitude, longitude, zoom] = centers[island.id]!;
  return {
    id: `island:${island.id}`, kind: "island", name: getLocationNames(island.name)[0]!,
    province: province.province, provinceCode: island.province,
    municipalityIds: island.municipalityIds, center: { latitude, longitude, zoom },
    aliases: island.id === "072" ? ["Eivissa"] : [],
    ...(island.id === "353" ? { excludeBounds: graciosa } : {}),
    ...(island.id === "073" ? { excludeBounds: cabrera } : {}),
  };
});
islandLocations.push(
  { id: "island:graciosa", kind: "island", name: "La Graciosa", province: "Las Palmas", provinceCode: "35", municipalityIds: ["35024"], aliases: [], bounds: graciosa, center: { latitude: 29.254, longitude: -13.506, zoom: 13 } },
  { id: "island:cabrera", kind: "island", name: "Cabrera", province: "Illes Balears", provinceCode: "07", municipalityIds: ["07040"], aliases: [], bounds: cabrera, center: { latitude: 39.145, longitude: 2.947, zoom: 13 } },
);

const islandByMunicipality = new Map(islandLocations.filter((island) => !island.bounds)
  .flatMap((island) => island.municipalityIds.map((id) => [id, island.name] as const)));
const locations: ExploreLocation[] = [...islandLocations, ...municipalityCatalog.map((city) => ({
  id: `municipality:${city.id}`, kind: "municipality" as const,
  name: city.name, province: city.province, provinceCode: city.provinceCode,
  municipalityIds: [city.id], aliases: [],
}))];
const byId = new Map(locations.map((location) => [location.id, location]));

export function getExploreLocation(id: string) { return byId.get(id); }

export function resolveExploreMunicipality(name: string, province?: string) {
  const matches = locations.filter((location) => location.kind === "municipality" &&
    locationNamesMatch(name, location.name) && (!province || locationNamesMatch(province, location.province)));
  return matches.length === 1 ? matches[0] : undefined;
}

export function getExploreMunicipalityNames(location: ExploreLocation): string[] {
  const ids = new Set(location.municipalityIds);
  return municipalityCatalog.filter((city) => ids.has(city.id)).map((city) => city.name);
}

export function searchExploreLocations(input: string): ExploreLocationChoice[] {
  const query = normalizeLocationSearch(input).replace(/\b(capital|municipio|provincia|isla)\b/g, "").replace(/\s+/g, " ").trim();
  if (query.length < 2 || query.length > 120) return [];
  const words = query.split(" ");
  return locations.map((location) => {
    const names = [...getLocationNames(location.name), ...location.aliases].map(normalizeLocationSearch);
    const islandName = location.kind === "municipality" ? islandByMunicipality.get(location.municipalityIds[0]!) ?? "" : "";
    const context = normalizeLocationSearch(`${location.province} ${islandName}`);
    const placeNames = [...names, normalizeLocationSearch(islandName)];
    const matches = words.some((word) => placeNames.some((name) => name.includes(word))) &&
      words.every((word) => [...names, context].some((name) => name.includes(word)));
    const score = names.includes(query) ? 3 : names.some((name) => name.startsWith(query)) ? 2 : 1;
    return { location, matches, score };
  }).filter((item) => item.matches)
    .sort((a, b) => b.score - a.score || Number(b.location.kind === "island") - Number(a.location.kind === "island") || a.location.name.localeCompare(b.location.name, "es"))
    .slice(0, 12)
    .map(({ location: { municipalityIds: _ids, aliases: _aliases, bounds: _bounds, excludeBounds: _exclude, ...choice } }) => choice);
}
