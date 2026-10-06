import { NextResponse } from "next/server";
import {
  resolveExploreMunicipality,
  searchExploreLocations,
} from "@/lib/locations/event-explore-locations";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  const cities = searchExploreLocations(query);
  const match =
    params.get("resolve") === "1"
      ? resolveExploreMunicipality(query, params.get("province") || undefined)
      : undefined;
  const location = match
    ? {
        id: match.id,
        name: match.name,
        province: match.province,
        provinceCode: match.provinceCode,
        kind: match.kind,
      }
    : null;
  return NextResponse.json(
    { cities, location },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
