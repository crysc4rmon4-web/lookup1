"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FEED_PAGE_SIZE,
  getEventFeed,
  type FeedEvent,
  type FeedLocation,
} from "@/services/events/event-feed";
import type { ExploreFilter } from "@/lib/events/event-explore-categories";

// The parent keys this hook's component by user, location and filter.
export function useEventFeed(
  token: string,
  location: FeedLocation,
  group: ExploreFilter,
) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offset = useRef(0);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const { city, province, locationId } = location;
  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    const request = new AbortController();
    controller.current = request;
    try {
      const page = await getEventFeed(
        token,
        { city, province, locationId },
        group,
        offset.current,
        request.signal,
      );
      if (request.signal.aborted) return;
      offset.current += page.length;
      setEvents((current) => {
        const known = new Set(current.map((event) => event.id));
        return [...current, ...page.filter((event) => !known.has(event.id))];
      });
      setHasMore(page.length === FEED_PAGE_SIZE);
    } catch (e) {
      if (!request.signal.aborted)
        setError(
          e instanceof Error ? e.message : "No se pudieron cargar los eventos.",
        );
    } finally {
      if (!request.signal.aborted) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [token, city, province, locationId, group]);
  useEffect(() => {
    void loadMore();
    return () => {
      controller.current?.abort();
      busy.current = false;
    };
  }, [loadMore]);
  return { events, loading, error, hasMore, loadMore };
}
