import type { UserLocation } from "./get-current-location";

type LocationListener = (
  location: UserLocation,
) => void;

export function watchLocation(
  listener: LocationListener,
): number {
  if (!("geolocation" in navigator)) {
    throw new Error(
      "Este navegador no soporta geolocalización.",
    );
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
      console.error(error);
    },

    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
  );
}