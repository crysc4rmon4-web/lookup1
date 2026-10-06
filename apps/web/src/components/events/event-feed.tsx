"use client";
import { useEffect, useRef } from "react";
import { CalendarDays, LoaderCircle } from "lucide-react";
import { useEventFeed } from "@/hooks/use-event-feed";
import type { FeedLocation } from "@/services/events/event-feed";
import type { ExploreFilter } from "@/lib/events/event-explore-categories";
import { EventFeedCard } from "./event-feed-card";

export function EventFeed({
  token,
  location,
  group,
  onCreate,
  onChangeCity,
}: {
  token: string;
  location: FeedLocation;
  group: ExploreFilter;
  onCreate: () => void;
  onChangeCity: () => void;
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
          <div className="feed-empty">
            <span className="feed-empty-icon">
              <CalendarDays size={32} />
            </span>
            <h2>
              {group === "all"
                ? "Ups, todavía no hay planes por aquí"
                : "No hay eventos de esta categoría"}
            </h2>
            <p>
              {group === "all"
                ? `No hay eventos programados en ${location.city}. ¿Y si el próximo lo creas tú?`
                : "Prueba otra categoría o descubre otra ciudad."}
            </p>
            <button
              type="button"
              onClick={onCreate}
              className="feed-primary-action"
            >
              Crear un evento
            </button>
            <button
              type="button"
              onClick={onChangeCity}
              className="min-h-11 text-sm font-bold text-[#5557D8]"
            >
              Buscar en otra ciudad
            </button>
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
