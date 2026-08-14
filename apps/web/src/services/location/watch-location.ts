import {
  normalizeLocationError,
  type LocationError,
  type UserLocation,
} from "./get-current-location";

type LocationListener = (location: UserLocation) => void;

type LocationErrorListener = (error: LocationError) => void;

export function watchLocation(
  listener: LocationListener,
  onError?: LocationErrorListener,
): number {
  if (!("geolocation" in navigator)) {
    throw new Error("GEOLOCATION_UNSUPPORTED");
  }

  return navigator.geolocation.watchPosition(
    ({ coords }) => {
      listener({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
    },

    (error) => {
      const normalizedError = normalizeLocationError(error);

      /*
       * Un TIMEOUT de watchPosition no invalida
       * la última ubicación ya obtenida.
       *
       * Puede ocurrir simplemente porque no se
       * obtuvo una nueva fijación dentro del tiempo.
       *
       * No generamos console.error ni destruimos
       * una sesión Radar que ya tiene posición.
       */
      if (normalizedError.code === "timeout") {
        return;
      }

      onError?.(normalizedError);
    },

    {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 20_000,
    },
  );
}