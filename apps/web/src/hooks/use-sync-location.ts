"use client";

import { useEffect } from "react";

import { useAuth } from "../components/auth-provider";

import { updateLocation } from "../services/location/update-location";

type Props = {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
};

const LOCATION_HEARTBEAT_MS = 20_000;

export function useSyncLocation({
  enabled,
  latitude,
  longitude,
  accuracy,
  loading,
}: Props) {
  const { user } = useAuth();

  useEffect(() => {
    if (
      !enabled ||
      loading ||
      !user ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    const sync = () => {
      void updateLocation(
        user.id,
        latitude,
        longitude,
        accuracy ?? undefined,
      ).catch((error) => {
        console.error("❌ Error sincronizando ubicación", error);
      });
    };

    /*
     * Primera sincronización inmediata.
     */
    sync();

    /*
     * Heartbeat:
     *
     * watchPosition no garantiza que recibamos
     * eventos si el usuario permanece quieto.
     *
     * Actualizamos updated_at periódicamente para
     * mantener viva la presencia mientras el radar
     * está activo.
     */
    const interval = window.setInterval(sync, LOCATION_HEARTBEAT_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, loading, user, latitude, longitude, accuracy]);
}
