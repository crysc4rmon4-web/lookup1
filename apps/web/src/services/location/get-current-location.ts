export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type LocationErrorCode =
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "low_accuracy"
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

const PRIVATE_ZONE_MAX_ACCEPTABLE_ACCURACY_METERS = 150;

function toUserLocation(
  position: GeolocationPosition,
): UserLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function requestCurrentPosition(
  options: PositionOptions,
): Promise<UserLocation> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(
      new Error("GEOLOCATION_UNSUPPORTED"),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(
          toUserLocation(position),
        );
      },

      (error) => {
        reject(error);
      },

      options,
    );
  });
}

export function normalizeLocationError(
  error: unknown,
): LocationError {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const geolocationError =
      error as GeolocationErrorLike;

    if (geolocationError.code === 1) {
      return {
        code: "permission_denied",
        message:
          "Necesitamos permiso de ubicación para usar esta función.",
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

  if (
    error instanceof Error &&
    error.message === "GEOLOCATION_LOW_ACCURACY"
  ) {
    return {
      code: "low_accuracy",
      message:
        "La precisión actual es demasiado baja para proteger esta zona correctamente.",
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

/*
 * ============================================================
 * RADAR
 * ============================================================
 *
 * Intento de alta precisión utilizado como apoyo
 * al watchPosition permanente del Radar.
 */
export async function getCurrentLocation(): Promise<UserLocation> {
  return requestCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15_000,
    maximumAge: 10_000,
  });
}

/*
 * ============================================================
 * ZONA PRIVADA — UBICACIÓN ACTUAL
 * ============================================================
 *
 * Aquí la experiencia es distinta al Radar.
 *
 * Primero intentamos obtener rápidamente una
 * posición de red/Wi-Fi/GPS reciente.
 *
 * Si su precisión no es suficiente, hacemos
 * un segundo intento de alta precisión.
 *
 * Esto evita que un portátil quede esperando
 * demasiado únicamente porque highAccuracy
 * no consigue fijación inmediatamente.
 */
export async function getPrivateZoneLocation(): Promise<UserLocation> {
  let quickLocation: UserLocation | null = null;

  try {
    quickLocation =
      await requestCurrentPosition({
        enableHighAccuracy: false,
        timeout: 6_000,
        maximumAge: 30_000,
      });

    if (
      quickLocation.accuracy <=
      PRIVATE_ZONE_MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      return quickLocation;
    }
  } catch (error) {
    const normalized =
      normalizeLocationError(error);

    /*
     * Estos errores no se solucionan
     * intentando otra modalidad.
     */
    if (
      normalized.code === "permission_denied" ||
      normalized.code === "unsupported"
    ) {
      throw error;
    }
  }

  try {
    const preciseLocation =
      await requestCurrentPosition({
        enableHighAccuracy: true,
        timeout: 9_000,
        maximumAge: 10_000,
      });

    const bestLocation =
      quickLocation &&
      quickLocation.accuracy <
        preciseLocation.accuracy
        ? quickLocation
        : preciseLocation;

    if (
      bestLocation.accuracy >
      PRIVATE_ZONE_MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      throw new Error(
        "GEOLOCATION_LOW_ACCURACY",
      );
    }

    return bestLocation;
  } catch (error) {
    /*
     * Si ya obtuvimos una posición razonable
     * en el primer intento, la conservamos.
     */
    if (
      quickLocation &&
      quickLocation.accuracy <=
        PRIVATE_ZONE_MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      return quickLocation;
    }

    if (
      quickLocation &&
      quickLocation.accuracy >
        PRIVATE_ZONE_MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      throw new Error(
        "GEOLOCATION_LOW_ACCURACY",
      );
    }

    throw error;
  }
}