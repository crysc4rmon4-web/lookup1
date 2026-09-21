import { NextResponse } from "next/server";
import { searchExploreLocations } from "@/lib/locations/event-explore-locations";

export function GET(request: Request) {
  const cities = searchExploreLocations(new URL(request.url).searchParams.get("q") ?? "");
  return NextResponse.json({ cities }, { headers: { "Cache-Control": "public, max-age=300" } });
}
