"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  exploreFilters,
  type ExploreFilter,
} from "@/lib/events/event-explore-categories";
import type { FeedLocation } from "@/services/events/event-feed";
import { EventFeed } from "./event-feed";

export function EventFeedScreen({
  token,
  location,
  group,
  onClose,
  onChangeCity,
}: {
  token: string;
  location: FeedLocation;
  group: ExploreFilter;
  onClose: () => void;
  onChangeCity: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState(group);
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
  return (
    <dialog
      ref={dialog}
      aria-labelledby="feed-title"
      onCancel={onClose}
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      className="lookup-feed-screen"
    >
      <header className="lookup-feed-header">
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver a Explorar"
          className="feed-header-button"
        >
          <ArrowLeft size={23} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 id="feed-title" className="text-base font-black tracking-tight">
            LookUp <span className="font-medium opacity-60">/ Feed</span>
          </h1>
          <button
            type="button"
            onClick={onChangeCity}
            className="flex min-h-11 max-w-full items-center gap-1 text-sm font-semibold"
          >
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{location.city}</span>
            <span className="sr-only">, cambiar ciudad</span>
          </button>
        </div>
        <label className="sr-only" htmlFor="feed-category">
          Categoría del feed
        </label>
        <select
          id="feed-category"
          value={filter}
          onChange={(e) => setFilter(e.target.value as ExploreFilter)}
          className="feed-category min-h-11 max-w-[42%] rounded-xl px-2 text-xs font-bold"
        >
          {exploreFilters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </header>
      <div className="min-h-0 flex-1">
        <EventFeed
          key={`${location.locationId || location.city}:${filter}`}
          token={token}
          location={location}
          group={filter}
        />
      </div>
    </dialog>
  );
}
