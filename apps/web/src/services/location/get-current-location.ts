export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type LocationErrorCode =
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unsupported"
  | "unknown";

export type LocationError = {
  code: LocationErrorCode;
  message: string;
};

type GeolocationErrorLike = {
  code?: unknown;
  message?: unknown;
};

export function normalizeLocationError(error: unknown): LocationError {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const geolocationError = error as GeolocationErrorLike;

    if (geolocationError.code === 1) {
      return {
        code: "permission_denied",
        message:
          "Necesitamos permiso de ubicación para activar el Radar.",
      };
    }

    if (geolocationError.code === 2) {
      return {
        code: "position_unavailable",
        message:
          "No pudimos determinar tu ubicación. Comprueba que la ubicación del dispositivo esté activa.",
      };
    }

    if (geolocationError.code === 3) {
      return {
        code: "timeout",
        message:
          "La ubicación está tardando más de lo esperado.",
      };
    }
  }

  if (
    error instanceof Error &&
    error.message === "GEOLOCATION_UNSUPPORTED"
  ) {
    return {
      code: "unsupported",
      message:
        "Este navegador no soporta geolocalización.",
    };
  }

  return {
    code: "unknown",
    message:
      error instanceof Error
        ? error.message
        : "No se pudo obtener la ubicación.",
  };
}

export async function getCurrentLocation(): Promise<UserLocation> {
  if (!("geolocation" in navigator)) {
    throw new Error("GEOLOCATION_UNSUPPORTED");
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
        timeout: 15_000,
        maximumAge: 10_000,
      },
    );
  });
}