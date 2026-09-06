"use client";

import {
  useEffect,
  useRef,
} from "react";

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

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

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
    useRef<
      HTMLDivElement | null
    >(null);

  const mapRef =
    useRef<
      import("maplibre-gl").Map | null
    >(null);

  const markerRef =
    useRef<
      import("maplibre-gl").Marker | null
    >(null);

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
   * Inicializamos MapLibre una única vez por modo
   * editable/no editable.
   *
   * Los cambios posteriores de coordenadas se gestionan
   * en otro efecto para no destruir el mapa cada vez
   * que el creador mueve el pin.
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

    async function initializeMap() {
      const maplibregl =
        await import(
          "maplibre-gl"
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
          longitude,
          latitude,
        ];

      const map =
        new maplibregl.Map({
          container:
            containerRef.current,

          style:
            MAP_STYLE,

          center,

          zoom:
            editable
              ? 17
              : 15,

          attributionControl:
            false,

          dragPan:
            editable,

          scrollZoom:
            false,

          boxZoom:
            editable,

          doubleClickZoom:
            editable,

          keyboard:
            editable,

          dragRotate:
            false,

          touchZoomRotate:
            editable,
        });

      mapRef.current =
        map;

      map.addControl(
        new maplibregl.AttributionControl({
          compact:
            true,
        }),
        "bottom-right",
      );

      if (editable) {
        map.addControl(
          new maplibregl.NavigationControl({
            showCompass:
              false,

            showZoom:
              true,
          }),
          "top-right",
        );
      }

      const marker =
        new maplibregl.Marker({
          draggable:
            editable,
        })
          .setLngLat(
            center,
          )
          .addTo(
            map,
          );

      markerRef.current =
        marker;

      function emitPosition(
        nextLongitude:
          number,
        nextLatitude:
          number,
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
              marker.getLngLat();

            emitPosition(
              next.lng,
              next.lat,
            );
          },
        );

        map.on(
          "click",
          (
            event,
          ) => {
            marker.setLngLat(
              event.lngLat,
            );

            emitPosition(
              event.lngLat.lng,
              event.lngLat.lat,
            );
          },
        );
      }

      /*
       * MapLibre puede inicializarse mientras un modal
       * todavía está terminando de calcular su tamaño.
       *
       * Ejecutar resize al cargar evita mapas recortados
       * o con zonas vacías.
       */
      map.once(
        "load",
        () => {
          if (!disposed) {
            map.resize();
          }
        },
      );
    }

    void initializeMap();

    return () => {
      disposed =
        true;

      markerRef.current =
        null;

      mapRef.current?.remove();

      mapRef.current =
        null;
    };

    /*
     * `editable` cambia el comportamiento completo del mapa.
     * Las coordenadas se sincronizan en el efecto siguiente.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editable,
  ]);

  /*
   * Sincronizamos coordenadas sin reconstruir MapLibre.
   *
   * Esto sirve tanto cuando:
   *
   * - el geocoder devuelve una posición nueva
   * - se abre otro evento
   * - el creador mueve el pin
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
        longitude,
        latitude,
      ];

    markerRef.current
      ?.setLngLat(
        next,
      );

    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const currentCenter =
      map.getCenter();

    const longitudeDifference =
      Math.abs(
        currentCenter.lng -
        longitude,
      );

    const latitudeDifference =
      Math.abs(
        currentCenter.lat -
        latitude,
      );

    /*
     * Si la nueva posición está realmente lejos del
     * centro visible, recentramos suavemente.
     *
     * Si simplemente fue un pequeño ajuste del pin,
     * no peleamos contra el usuario moviendo el mapa.
     */
    if (
      longitudeDifference >
        0.002 ||
      latitudeDifference >
        0.002
    ) {
      map.easeTo({
        center:
          next,

        duration:
          450,
      });
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
        className="absolute inset-0"
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

      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-slate-950/5" />

      {editable ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-600 shadow-lg backdrop-blur">
          Mueve el pin o toca el mapa para afinar la ubicación
        </div>
      ) : null}
    </div>
  );
}