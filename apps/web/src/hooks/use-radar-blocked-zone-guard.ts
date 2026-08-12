"use client";

import { useEffect, useRef } from "react";

import type { RadarBlockedZone } from "@lookup/services";

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type UseRadarBlockedZoneGuardProps = {
  enabled: boolean;
  zones: RadarBlockedZone[];
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  onBlockedZoneDetected: () => Promise<void>;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceInMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadius = 6_371_000;

  const latitudeDifference = toRadians(latitudeB - latitudeA);

  const longitudeDifference = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function isInsideBlockedZone(coordinates: Coordinates, zone: RadarBlockedZone) {
  if (coordinates.latitude === null || coordinates.longitude === null) {
    return false;
  }

  const distance = getDistanceInMeters(
    coordinates.latitude,
    coordinates.longitude,
    zone.latitude,
    zone.longitude,
  );

  return distance <= zone.radius_meters;
}

export function useRadarBlockedZoneGuard({
  enabled,
  zones,
  latitude,
  longitude,
  loading,
  onBlockedZoneDetected,
}: UseRadarBlockedZoneGuardProps) {
  const disablingRef = useRef(false);

  useEffect(() => {
    if (
      !enabled ||
      loading ||
      latitude === null ||
      longitude === null ||
      zones.length === 0 ||
      disablingRef.current
    ) {
      return;
    }

    const coordinates = {
      latitude,
      longitude,
    };

    const blockedZone = zones.find((zone) =>
      isInsideBlockedZone(coordinates, zone),
    );

    if (!blockedZone) {
      return;
    }

    disablingRef.current = true;

    void onBlockedZoneDetected()
      .catch((error) => {
        console.error(
          "❌ Error apagando el radar dentro de una zona bloqueada",
          error,
        );
      })
      .finally(() => {
        disablingRef.current = false;
      });
  }, [enabled, zones, latitude, longitude, loading, onBlockedZoneDetected]);
}
