"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";
import type { ExploreLocationChoice } from "@/lib/locations/event-explore-locations";

export function EventFeedCitySearch({
  initialCity,
  onSelect,
  onClose,
}: {
  initialCity: string;
  onSelect: (city: ExploreLocationChoice) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialCity);
  const [choices, setChoices] = useState<ExploreLocationChoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setChoices([]);
    setError("");
    if (query.trim().length < 2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/events/cities?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error("No pudimos buscar. Vuelve a intentarlo.");
        const data = (await response.json()) as {
          cities: ExploreLocationChoice[];
        };
        if (!controller.signal.aborted) {
          setChoices(data.cities);
          if (!data.cities.length)
            setError("No encontramos esa ciudad. Prueba otro nombre.");
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "No pudimos buscar.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <section className="feed-city-search" aria-label="Buscar otra ciudad">
      <div className="flex items-center gap-2">
        <Search size={19} aria-hidden="true" />
        <input
          ref={input}
          aria-label="Ciudad o isla"
          placeholder="Busca una ciudad o isla…"
          value={query}
          maxLength={120}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar búsqueda"
          className="feed-header-button"
        >
          <X size={19} />
        </button>
      </div>
      <div className="max-h-[45dvh] overflow-y-auto">
        {loading ? (
          <p role="status" className="flex items-center gap-2 py-4 text-sm">
            <LoaderCircle size={16} className="animate-spin" />
            Buscando ciudades…
          </p>
        ) : null}
        {error ? (
          <p role="status" className="py-4 text-sm">
            {error}
          </p>
        ) : null}
        {!loading && !error && query.trim().length < 2 ? (
          <p className="py-4 text-sm">Escribe al menos dos letras.</p>
        ) : null}
        <ul>
          {choices.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => onSelect(city)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-[var(--lookup-soft)]"
              >
                <MapPin size={18} className="shrink-0 text-[#5D5FEF]" />
                <span>
                  <span className="block font-bold">{city.name}</span>
                  <span className="text-xs opacity-70">
                    {city.kind === "island" ? "Isla" : "Municipio"} ·{" "}
                    {city.province}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
