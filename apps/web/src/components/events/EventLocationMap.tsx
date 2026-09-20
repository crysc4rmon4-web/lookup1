"use client";

import {
  useEffect,
  useRef,
} from "react";

import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";

import { createEventTileLayer } from "@/lib/events/event-map-tiles";

type EventLocationPosition = {
  latitude: number;
  longitude: number;
};

type EventLocationMapProps = {
  latitude: number;
  longitude: number;

  editable?: boolean;

  onPositionChange?: (
    position: EventLocationPosition,
  ) => void;

  className?: string;
};

function hasValidCoordinates(
  latitude: number,
  longitude: number,
) {
  return (
    Number.isFinite(
      latitude,
    ) &&
    Number.isFinite(
      longitude,
    ) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function EventLocationMap({
  latitude,
  longitude,
  editable = false,
  onPositionChange,
  className = "h-48",
}: EventLocationMapProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const mapRef =
    useRef<LeafletMap | null>(
      null,
    );

  const markerRef =
    useRef<LeafletMarker | null>(
      null,
    );

  const onPositionChangeRef =
    useRef(
      onPositionChange,
    );

  useEffect(() => {
    onPositionChangeRef.current =
      onPositionChange;
  }, [
    onPositionChange,
  ]);

  /*
   * Creamos Leaflet una sola vez.
   *
   * El mapa usa tiles raster de Stadia Maps.
   * No depende de WebGL ni de Web Workers.
   */
  useEffect(() => {
    const container =
      containerRef.current;

    if (
      !container ||
      !hasValidCoordinates(
        latitude,
        longitude,
      )
    ) {
      return;
    }

    let disposed =
      false;

    let resizeObserver:
      ResizeObserver | null =
      null;

    async function initializeMap() {
      try {
        const L =
          await import(
            "leaflet"
          );

        if (
          disposed ||
          !containerRef.current
        ) {
          return;
        }

        const center:
          [number, number] =
          [
            latitude,
            longitude,
          ];

        const map =
          L.map(
            containerRef.current,
            {
              attributionControl:
                true,

              zoomControl:
                editable,

              dragging:
                editable,

              scrollWheelZoom:
                false,

              doubleClickZoom:
                editable,

              boxZoom:
                editable,

              keyboard:
                editable,
            },
          );

        map.setView(
          center,
          editable
            ? 17
            : 15,
        );

        mapRef.current =
          map;

        /*
         * Stadia Maps · Alidade Smooth.
         *
         * La API key se envía como query parameter,
         * forma soportada oficialmente por Stadia.
         */
        const tileLayer = createEventTileLayer(L);

        tileLayer.on(
          "tileerror",
          (tileError) => {
            console.error(
              "❌ No se pudo cargar un tile de Stadia Maps:",
              tileError,
            );
          },
        );

        tileLayer.addTo(
          map,
        );

        /*
         * Marcador propio.
         *
         * Evitamos depender de los PNG internos
         * del marcador por defecto de Leaflet.
         */
        const markerIcon =
          L.divIcon({
            className:
              "lookup-event-location-marker",

            html: `
              <div
                style="
                  width: 30px;
                  height: 30px;
                  border-radius: 9999px;
                  background: #5D5FEF;
                  border: 4px solid white;
                  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.28);
                  position: relative;
                "
              >
                <div
                  style="
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 6px;
                    height: 6px;
                    border-radius: 9999px;
                    background: white;
                    transform: translate(-50%, -50%);
                  "
                ></div>
              </div>
            `,

            iconSize:
              [
                30,
                30,
              ],

            iconAnchor:
              [
                15,
                15,
              ],
          });

        const marker =
          L.marker(
            center,
            {
              icon:
                markerIcon,

              draggable:
                editable,

              autoPan:
                editable,

              title:
                editable
                  ? "Mueve el punto exacto del evento"
                  : "Ubicación del evento",

              alt:
                "Ubicación del evento",
            },
          ).addTo(
            map,
          );

        markerRef.current =
          marker;

        function emitPosition(
          nextLatitude: number,
          nextLongitude: number,
        ) {
          onPositionChangeRef
            .current?.({
              latitude:
                nextLatitude,

              longitude:
                nextLongitude,
            });
        }

        if (editable) {
          marker.on(
            "dragend",
            () => {
              const next =
                marker.getLatLng();

              emitPosition(
                next.lat,
                next.lng,
              );
            },
          );

          map.on(
            "click",
            (
              mapEvent,
            ) => {
              marker.setLatLng(
                mapEvent.latlng,
              );

              emitPosition(
                mapEvent.latlng.lat,
                mapEvent.latlng.lng,
              );
            },
          );
        }

        /*
         * El mapa vive dentro de modales.
         *
         * Leaflet necesita recalcular el tamaño
         * después de que el modal termine de pintar.
         */
        window.requestAnimationFrame(
          () => {
            if (!disposed) {
              map.invalidateSize();
            }
          },
        );

        window.setTimeout(
          () => {
            if (!disposed) {
              map.invalidateSize();
            }
          },
          150,
        );

        if (
          typeof ResizeObserver !==
          "undefined"
        ) {
          resizeObserver =
            new ResizeObserver(
              () => {
                if (!disposed) {
                  map.invalidateSize({
                    pan:
                      false,
                  });
                }
              },
            );

          resizeObserver.observe(
            containerRef.current,
          );
        }
      } catch (mapError) {
        console.error(
          "❌ No se pudo inicializar el mapa del evento:",
          mapError,
        );
      }
    }

    void initializeMap();

    return () => {
      disposed =
        true;

      resizeObserver
        ?.disconnect();

      markerRef.current =
        null;

      mapRef.current
        ?.remove();

      mapRef.current =
        null;
    };

    /*
     * El modo editable cambia las interacciones
     * completas del mapa.
     *
     * Las coordenadas se sincronizan abajo.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editable,
  ]);

  /*
   * Sin destruir el mapa,
   * sincronizamos coordenadas nuevas.
   */
  useEffect(() => {
    if (
      !hasValidCoordinates(
        latitude,
        longitude,
      )
    ) {
      return;
    }

    const next:
      [number, number] =
      [
        latitude,
        longitude,
      ];

    markerRef.current
      ?.setLatLng(
        next,
      );

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const currentCenter =
      map.getCenter();

    const latitudeDifference =
      Math.abs(
        currentCenter.lat -
        latitude,
      );

    const longitudeDifference =
      Math.abs(
        currentCenter.lng -
        longitude,
      );

    /*
     * Si las coordenadas cambian realmente de zona,
     * recentramos.
     *
     * Para pequeños ajustes manuales no hacemos
     * que el mapa pelee contra el usuario.
     */
    if (
      latitudeDifference >
        0.002 ||
      longitudeDifference >
        0.002
    ) {
      map.panTo(
        next,
        {
          animate:
            true,

          duration:
            0.45,
        },
      );
    }
  }, [
    latitude,
    longitude,
  ]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm ${className}`}
    >
      <div
        ref={
          containerRef
        }
        className="absolute inset-0 z-0"
        role={
          editable
            ? undefined
            : "img"
        }
        aria-label={
          editable
            ? "Mapa editable de ubicación del evento. Puedes mover el marcador."
            : "Mapa de ubicación del evento."
        }
      />

      <div className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-slate-950/5" />

      {editable ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-600 shadow-lg backdrop-blur">
          Mueve el punto o toca el mapa para afinar la ubicación
        </div>
      ) : null}
    </div>
  );
}