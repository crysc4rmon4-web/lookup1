import type { ExploreEvent } from "./get-explore-events";
import type { PersistedEventImage } from "@/lib/events/event-images";
import type { ExploreFilter } from "@/lib/events/event-explore-categories";

export type FeedEvent = ExploreEvent & {
  images: PersistedEventImage[];
  likeCount: number | null;
  isLiked: boolean;
};
export type FeedLocation = {
  city: string;
  province: string;
  locationId: string;
};
export const FEED_PAGE_SIZE = 12;

export async function getEventFeed(
  token: string,
  location: FeedLocation,
  group: ExploreFilter,
  offset: number,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    ...location,
    view: "feed",
    group,
    offset: String(offset),
    limit: String(FEED_PAGE_SIZE),
  });
  const response = await fetch(`/api/events/explore?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    events?: FeedEvent[];
    error?: string;
  };
  if (!response.ok || !Array.isArray(payload.events))
    throw new Error(payload.error ?? "No se pudieron cargar los eventos.");
  return payload.events;
}
