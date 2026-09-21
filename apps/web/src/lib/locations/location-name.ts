import { normalizeLocationSearch } from "./spain-locations";

// Preserve official names, bilingual alternatives and INE's trailing articles.
export function getLocationNames(value: string): string[] {
  const clean = value.trim().replace(/^(provincia de|province of)\s+/i, "");
  const names = [clean, ...clean.split("/")].flatMap((part) => {
    const name = part.trim();
    const natural = name.replace(/^(.+),\s*(el|la|los|las|a|o|as|os|els|les)$/i, "$2 $1");
    return [natural, name];
  });
  return [...new Set(names.filter(Boolean))];
}

export function getLocationKeys(value: string): string[] {
  return [...new Set(getLocationNames(value).flatMap((name) => {
    const lower = name.toLowerCase().replace(/\s+/g, " ");
    const plain = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const words = normalizeLocationSearch(name);
    return [lower, plain, words, words.replace(/ /g, "-")];
  }))];
}

export function locationNamesMatch(actual: string, official: string) {
  const expected = getLocationNames(official).map(normalizeLocationSearch);
  return getLocationNames(actual).some((name) => expected.includes(normalizeLocationSearch(name)));
}
