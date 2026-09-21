// Shared palette for filters, badges and markers; hex colors also support older Safari.
export const exploreFilters = [
  { id: "all", label: "Todo", color: "#5D5FEF", surface: "#F0F0FF", path: "M4 5h16v16H4zM8 3v4m8-4v4M4 11h16" },
  { id: "leisure", label: "Ocio y planes", color: "#6554A4", surface: "#F2EFFA", path: "m12 3 2.5 5.5L21 9l-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 9l6.5-.5z" },
  { id: "music", label: "Música", color: "#A3446A", surface: "#FAEFF3", path: "M9 18V5l12-2v13M9 9l12-2M9 18a3 3 0 1 1-3-3h3m12 1a3 3 0 1 1-3-3h3" },
  { id: "culture", label: "Arte y cultura", color: "#956124", surface: "#FAF3E8", path: "m3 8 9-5 9 5H3zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18" },
  { id: "food", label: "Gastronomía", color: "#A65332", surface: "#FAF0EA", path: "M4 3v5a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 2-5 7-5 10h5M20 3v18" },
  { id: "fitness", label: "Deporte y fitness", color: "#39724F", surface: "#EDF5EF", path: "M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12" },
  { id: "wellness", label: "Bienestar", color: "#267671", surface: "#EAF5F3", path: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" },
  { id: "business", label: "Negocios", color: "#4566A4", surface: "#EEF2FA", path: "M3 7h18v14H3zM8 7V3h8v4M3 12a20 20 0 0 0 18 0M12 11v4" },
  { id: "technology", label: "Tecnología", color: "#326F87", surface: "#EDF4F8", path: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" },
  { id: "education", label: "Cursos y talleres", color: "#76603D", surface: "#F5F2EB", path: "M12 5v16M3 3c4 0 6 0 9 2 3-2 5-2 9-2v16c-4 0-6 0-9 2-3-2-5-2-9-2z" },
  { id: "family", label: "Familia y comunidad", color: "#875674", surface: "#F6EFF4", path: "M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM5 21v-2a7 7 0 0 1 14 0v2M3 4v6M1 7h4" },
] as const;
export type ExploreFilter = typeof exploreFilters[number]["id"];

const categories: Record<string, { label: string; group: Exclude<ExploreFilter, "all"> }> = {
  "music": { label: "Música", group: "music" },
  "arts-culture": { label: "Arte y cultura", group: "culture" },
  "gastronomy": { label: "Gastronomía", group: "food" },
  "sports-outdoors": { label: "Deporte y aire libre", group: "fitness" },
  "health-wellness": { label: "Salud y bienestar", group: "wellness" },
  "technology-science": { label: "Tecnología y ciencia", group: "technology" },
  "business-networking": { label: "Negocios y networking", group: "business" },
  "education-workshops": { label: "Formación y talleres", group: "education" },
  "family": { label: "Familia", group: "family" },
  "pets": { label: "Mascotas", group: "family" },
  "games-leisure": { label: "Juegos y ocio", group: "leisure" },
  "community-causes": { label: "Comunidad y causas", group: "family" },
  "nightlife": { label: "Fiesta y vida nocturna", group: "leisure" },
  "tourism-visits": { label: "Turismo y visitas", group: "leisure" },
  "experiences-curiosities": { label: "Experiencias y curiosidades", group: "leisure" },
};
export function getExploreCategory(slug: string) {
  const category = categories[slug] ?? { label: slug.replace(/-/g, " "), group: "leisure" as const };
  const theme = exploreFilters.find((filter) => filter.id === category.group)!;
  return { ...category, color: theme.color, surface: theme.surface, path: theme.path };
}
