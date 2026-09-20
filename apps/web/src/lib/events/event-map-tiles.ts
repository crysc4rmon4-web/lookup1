import type * as Leaflet from "leaflet";

export function createEventTileLayer(L: typeof Leaflet) {
  const key = process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY?.trim();
  // Localhost needs no key; deployed web domains can use Stadia domain authentication.
  return L.tileLayer(
    `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png${key ? `?api_key=${encodeURIComponent(key)}` : ""}`,
    {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/attribution/" target="_blank" rel="noopener noreferrer">Stadia Maps</a>, ' +
        '&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    },
  );
}
