"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, RotateCcw } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { createEventTileLayer } from "@/lib/events/event-map-tiles";
import { getExploreCategory } from "@/lib/events/event-explore-categories";
import type { ExploreEvent } from "@/services/events/get-explore-events";

type Props = { latitude: number; longitude: number; city: string; events: ExploreEvent[] };

export function EventExploreMap({ latitude, longitude, city, events }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const recenterRef = useRef<(() => void) | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let frame = 0;
    async function initialize() {
      try {
        const L = await import("leaflet");
        if (disposed || !containerRef.current) return;
        const instance = L.map(containerRef.current, {
          scrollWheelZoom: true, touchZoom: true, zoomControl: false,
          zoomSnap: 0.5, wheelPxPerZoomLevel: 100,
        });
        mapRef.current = instance;
        L.control.zoom({ position: "topright", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(instance);
        const tiles = createEventTileLayer(L);
        tiles.on("tileerror", () => {
          if (!disposed) setError("No se pudo cargar el fondo del mapa. Los eventos siguen disponibles en la lista.");
        });
        tiles.addTo(instance);
        observer = new ResizeObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => { if (!disposed) instance.invalidateSize({ pan: false }); });
        });
        observer.observe(containerRef.current);
        setMap(instance);
      } catch {
        if (!disposed) setError("No se pudo cargar el mapa. Puedes abrir los eventos desde la lista.");
      }
    }
    void initialize();
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      mapRef.current?.remove();
      mapRef.current = null;
      recenterRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    let disposed = false;
    let removeMarkers: (() => void) | undefined;
    async function update() {
      const L = await import("leaflet");
      if (disposed || !map || mapRef.current !== map) return;
      const markers = L.layerGroup().addTo(map);
      removeMarkers = () => { markers.remove(); };
      const bounds = L.latLngBounds([[latitude, longitude]]);
      const groups = new Map<string, { lat: number; lng: number; events: ExploreEvent[] }>();
      for (const event of events) {
        const lat = event.latitude, lng = event.longitude;
        if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
        const key = `${lat},${lng}`;
        const group = groups.get(key);
        if (group) group.events.push(event);
        else groups.set(key, { lat, lng, events: [event] });
      }
      for (const group of groups.values()) {
        const first = group.events[0]!;
        const multiple = group.events.length > 1;
        const label = multiple ? `${group.events.length} eventos en este lugar` : `${first.title} · ${getExploreCategory(first.category).label}`;
        bounds.extend([group.lat, group.lng]);
        const icon = L.divIcon({
          className: "lookup-explore-marker",
          html: `<span class="lookup-explore-marker__dot">${multiple ? group.events.length : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-10 4h4"/></svg>'}</span>`,
          iconSize: [44, 44], iconAnchor: [22, 22],
        });
        const marker = L.marker([group.lat, group.lng], { icon, title: label, alt: label, keyboard: true }).addTo(markers);
        if (multiple) {
          const list = document.createElement("div");
          list.className = "lookup-explore-popup";
          for (const event of group.events) {
            const link = document.createElement("a");
            link.href = `/events/${encodeURIComponent(event.id)}`;
            link.textContent = event.title;
            list.append(link);
          }
          marker.bindPopup(list, { maxWidth: 260 });
        } else {
          marker.on("click", () => router.push(`/events/${encodeURIComponent(first.id)}`));
        }
      }
      const recenter = () => {
        if (groups.size) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14, animate: false });
        else map.setView([latitude, longitude], 13, { animate: false });
      };
      recenterRef.current = recenter;
      recenter();
    }
    void update();
    return () => { disposed = true; removeMarkers?.(); recenterRef.current = null; };
  }, [map, latitude, longitude, events, router]);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#5D5FEF]/10 bg-white shadow-sm" aria-label={`Mapa de eventos en ${city}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-800"><MapPin size={16} className="shrink-0 text-[#5D5FEF]" /><span className="truncate">{city}</span></p>
        <button type="button" disabled={!map} onClick={() => recenterRef.current?.()} className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#5557D8] hover:bg-[#F0F0FF] disabled:opacity-50"><RotateCcw size={14} />Centrar</button>
      </div>
      <div ref={containerRef} className="lookup-explore-map relative z-0 h-[min(55svh,24rem)] min-h-64 w-full bg-[#F0F0FF] sm:h-96" />
      <p className="px-4 py-3 text-[11px] leading-4 text-slate-500">Acerca con dos dedos o con + y −. Toca un punto para ver el evento.</p>
      {error ? <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p> : null}
    </section>
  );
}
