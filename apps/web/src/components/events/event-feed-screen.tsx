"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  Map,
  Plus,
  Search,
} from "lucide-react";
import {
  exploreFilters,
  type ExploreFilter,
} from "@/lib/events/event-explore-categories";
import type { ExploreLocationChoice } from "@/lib/locations/event-explore-locations";
import type { FeedLocation } from "@/services/events/event-feed";
import { EventFeed } from "./event-feed";
import { EventFeedCitySearch } from "./event-feed-city-search";

export function EventFeedScreen({
  token,
  location,
  initialCity,
  locating,
  group,
  onClose,
  onSelectCity,
  onSaved,
  onMine,
  onCreate,
}: {
  token: string;
  location: FeedLocation | null;
  initialCity: string;
  locating: boolean;
  group: ExploreFilter;
  onClose: () => void;
  onSelectCity: (city: ExploreLocationChoice) => void;
  onSaved: () => void;
  onMine: () => void;
  onCreate: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const [filter, setFilter] = useState(group);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  function closeSearch() {
    setSearching(false);
    searchButton.current?.focus();
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="feed-title"
      onCancel={(event) => {
        if (searching) {
          event.preventDefault();
          closeSearch();
        } else onClose();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="lookup-feed-screen"
    >
      <div className="feed-chrome">
        <header className="lookup-feed-header">
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver a Explorar"
            className="feed-header-button"
          >
            <ArrowLeft size={21} />
          </button>
          <h1 id="feed-title" className="feed-wordmark">
            LookUp<span className="sr-only"> · Eventos</span>
          </h1>
          <button
            ref={searchButton}
            type="button"
            onClick={() => setSearching(!searching)}
            aria-expanded={searching}
            aria-label={`${location?.city || "Elegir ciudad"}, buscar otra ciudad`}
            className="feed-city-trigger"
          >
            <Search size={16} />
            <span className="truncate">{location?.city || "¿Dónde?"}</span>
            <ChevronDown size={14} />
          </button>
        </header>
        <nav aria-label="Tus eventos" className="feed-shortcuts">
          <button type="button" onClick={onSaved}>
            <Bookmark size={21} />
            Guardados
          </button>
          <button type="button" onClick={onMine}>
            <CalendarDays size={21} />
            Mis eventos
          </button>
          <button type="button" onClick={onCreate} className="feed-create">
            <Plus size={21} />
            Crear
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Explorar mapa y lista"
            title="Mapa y lista"
          >
            <Map size={21} />
            Mapa
          </button>
        </nav>
        {searching ? (
          <EventFeedCitySearch
            initialCity={location?.city || initialCity}
            onClose={closeSearch}
            onSelect={(city) => {
              onSelectCity(city);
              setFilter("all");
              closeSearch();
            }}
          />
        ) : null}
        <div className="feed-filter-row">
          <span className="text-xs opacity-60">Tu próximo plan</span>
          <label className="sr-only" htmlFor="feed-category">
            Categoría del feed
          </label>
          <select
            id="feed-category"
            value={filter}
            onChange={(e) => setFilter(e.target.value as ExploreFilter)}
            className="feed-category min-h-11 max-w-[65%] rounded-xl px-2 text-xs font-bold"
          >
            {exploreFilters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {location ? (
          <EventFeed
            key={`${location.locationId || location.city}:${filter}`}
            token={token}
            location={location}
            group={filter}
            onCreate={onCreate}
            onChangeCity={() => setSearching(true)}
          />
        ) : (
          <div className="feed-empty" role="status">
            {locating ? (
              <>
                <LoaderCircle size={28} className="animate-spin" />
                <h2>Buscando planes para ti…</h2>
              </>
            ) : (
              <>
                <Search size={30} />
                <h2>Tu próximo plan empieza aquí</h2>
                <p>Elige una ciudad y descubre qué se mueve cerca.</p>
                <button
                  type="button"
                  onClick={() => setSearching(true)}
                  className="feed-primary-action"
                >
                  Elegir ciudad
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
