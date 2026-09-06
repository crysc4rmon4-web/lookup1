import "server-only";

import type {
  EventLocationAdjustment,
} from "./event-domain";

import type {
  VerifiedEventLocation,
} from "./geocode-event-location";

const MAX_EVENT_LOCATION_ADJUSTMENT_METERS =
  500;

const EARTH_RADIUS_METERS =
  6_371_000;

function toRadians(
  degrees: number,
) {
  return (
    degrees *
    Math.PI /
    180
  );
}

export function getDistanceMeters(
  first: {
    latitude: number;
    longitude: number;
  },
  second: {
    latitude: number;
    longitude: number;
  },
) {
  const latitudeDelta =
    toRadians(
      second.latitude -
      first.latitude,
    );

  const longitudeDelta =
    toRadians(
      second.longitude -
      first.longitude,
    );

  const firstLatitude =
    toRadians(
      first.latitude,
    );

  const secondLatitude =
    toRadians(
      second.latitude,
    );

  const haversine =
    Math.sin(
      latitudeDelta / 2,
    ) ** 2 +
    Math.cos(
      firstLatitude,
    ) *
    Math.cos(
      secondLatitude,
    ) *
    Math.sin(
      longitudeDelta / 2,
    ) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(
        haversine,
      ),
      Math.sqrt(
        1 -
        haversine,
      ),
    );

  return (
    EARTH_RADIUS_METERS *
    angularDistance
  );
}

export function applyEventLocationAdjustment(
  verified:
    VerifiedEventLocation,
  adjustment:
    EventLocationAdjustment | null,
) {
  if (!adjustment) {
    return {
      latitude:
        verified.latitude,

      longitude:
        verified.longitude,

      adjustmentDistanceMeters:
        0,
    };
  }

  const distance =
    getDistanceMeters(
      {
        latitude:
          verified.latitude,

        longitude:
          verified.longitude,
      },
      adjustment,
    );

  if (
    distance >
    MAX_EVENT_LOCATION_ADJUSTMENT_METERS
  ) {
    throw new Error(
      "El punto seleccionado está demasiado lejos de la dirección verificada. Ajusta el pin cerca del lugar del evento.",
    );
  }

  return {
    latitude:
      adjustment.latitude,

    longitude:
      adjustment.longitude,

    adjustmentDistanceMeters:
      Math.round(
        distance,
      ),
  };
}