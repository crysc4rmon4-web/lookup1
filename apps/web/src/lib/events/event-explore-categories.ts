export const exploreFilters = [
  { id: "all", label: "Todo" },
  { id: "leisure", label: "Ocio" },
  { id: "business", label: "Negocios" },
  { id: "fitness", label: "Fitness" },
  { id: "food", label: "Gastronomía" },
] as const;
export type ExploreFilter = typeof exploreFilters[number]["id"];

const categories: Record<string, { label: string; group: ExploreFilter }> = {
  "music": { label: "Música", group: "leisure" },
  "arts-culture": { label: "Arte y cultura", group: "leisure" },
  "gastronomy": { label: "Gastronomía", group: "food" },
  "sports-outdoors": { label: "Deporte y aire libre", group: "fitness" },
  "health-wellness": { label: "Salud y bienestar", group: "fitness" },
  "technology-science": { label: "Tecnología y ciencia", group: "business" },
  "business-networking": { label: "Negocios y networking", group: "business" },
  "education-workshops": { label: "Formación y talleres", group: "business" },
  "family": { label: "Familia", group: "leisure" },
  "pets": { label: "Mascotas", group: "leisure" },
  "games-leisure": { label: "Juegos y ocio", group: "leisure" },
  "community-causes": { label: "Comunidad y causas", group: "leisure" },
  "nightlife": { label: "Fiesta y vida nocturna", group: "leisure" },
  "tourism-visits": { label: "Turismo y visitas", group: "leisure" },
  "experiences-curiosities": { label: "Experiencias y curiosidades", group: "leisure" },
};
export function getExploreCategory(slug: string) {
  return categories[slug] ?? { label: slug.replace(/-/g, " "), group: "leisure" as const };
}
