export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export async function getCurrentLocation(): Promise<UserLocation> {
  if (!("geolocation" in navigator)) {
    throw new Error(
      "Este navegador no soporta geolocalización.",
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
      },

      (error) => {
        reject(error);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
}