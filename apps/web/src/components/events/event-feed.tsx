"use client";
import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { useEventFeed } from "@/hooks/use-event-feed";
import type { FeedLocation } from "@/services/events/event-feed";
import type { ExploreFilter } from "@/lib/events/event-explore-categories";
import { EventFeedCard } from "./event-feed-card";

export function EventFeed({
  token,
  location,
  group,
}: {
  token: string;
  location: FeedLocation;
  group: ExploreFilter;
}) {
  const { events, loading, error, hasMore, loadMore } = useEventFeed(
    token,
    location,
    group,
  );
  const root = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinel.current || loading || error || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { root: root.current, rootMargin: "200px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, hasMore, loadMore]);
  return (
    <section
      className="h-full"
      aria-label={`Feed de eventos en ${location.city}`}
    >
      <div
        ref={root}
        tabIndex={0}
        aria-label="Eventos, desplázate para ver más"
        className="lookup-feed-scroll"
      >
        {events.map((event) => (
          <EventFeedCard key={event.id} event={event} />
        ))}
        {!loading && !error && !events.length ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="font-bold text-slate-800">
              Todavía no hay eventos{" "}
              {group === "all" ? "en este lugar" : "de este tipo"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Prueba otra categoría o ubicación.
            </p>
          </div>
        ) : null}
        <div
          ref={sentinel}
          className="flex min-h-40 flex-col items-center justify-center gap-3 p-4 text-center"
        >
          {loading ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <LoaderCircle size={18} className="animate-spin" />
              Cargando eventos…
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {!loading && (hasMore || error) ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#5557D8] shadow-sm"
            >
              {error ? "Reintentar" : "Ver más eventos"}
            </button>
          ) : null}
          {!hasMore && events.length > 0 ? (
            <p className="text-sm text-slate-500">
              Has visto todos los eventos. Prueba otra categoría o ciudad.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
