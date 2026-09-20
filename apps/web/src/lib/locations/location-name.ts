import { normalizeLocationSearch } from "./spain-locations";

// INE includes bilingual names and articles at the end (e.g. "Coruña, A").
export function locationNamesMatch(actual: string, official: string) {
  const aliases = (value: string) => value.split("/").map((name) => normalizeLocationSearch(
    name.replace(/^(provincia de|province of)\s+/i, "")
      .replace(/^(.+),\s*(el|la|los|las|a|o|as|os|els|les)$/i, "$2 $1"),
  ));
  const expected = aliases(official);
  return aliases(actual).some((name) => name.length > 0 && expected.includes(name));
}
