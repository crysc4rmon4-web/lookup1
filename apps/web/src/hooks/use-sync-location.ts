"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../components/auth-provider";

import { updateLocation } from "../services/location/update-location";

type Props = {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
};

type SyncLocationState = {
  ready: boolean;
  syncing: boolean;
  radarAllowed: boolean | null;
  error: string | null;
};

const LOCATION_HEARTBEAT_MS = 20_000;

const INITIAL_STATE: SyncLocationState = {
  ready: false,
  syncing: false,
  radarAllowed: null,
  error: null,
};

export function useSyncLocation({
  enabled,
  latitude,
  longitude,
  accuracy,
  loading,
}: Props): SyncLocationState {
  const { user } = useAuth();

  const [state, setState] = useState<SyncLocationState>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL_STATE);
      return;
    }

    if (
      loading ||
      !user ||
      latitude === null ||
      longitude === null
    ) {
      setState((current) => ({
        ...current,
        ready: false,
        syncing: loading,
      }));

      return;
    }

    /*
     * Guardamos valores ya validados.
     *
     * Así TypeScript sabe que dentro de
     * las funciones async posteriores
     * nunca serán null.
     */
    const userId = user.id;
    const currentLatitude = latitude;
    const currentLongitude = longitude;
    const currentAccuracy = accuracy;

    let cancelled = false;

    async function sync(showLoading: boolean) {
      if (showLoading && !cancelled) {
        setState((current) => ({
          ...current,
          syncing: true,
          error: null,
        }));
      }

      try {
        const radarAllowed = await updateLocation(
          userId,
          currentLatitude,
          currentLongitude,
          currentAccuracy ?? undefined,
        );

        if (cancelled) {
          return;
        }

        setState({
          ready: radarAllowed,
          syncing: false,
          radarAllowed,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("❌ Error sincronizando ubicación", error);

        setState({
          ready: false,
          syncing: false,
          radarAllowed: null,
          error:
            error instanceof Error
              ? error.message
              : "No se pudo sincronizar la ubicación.",
        });
      }
    }

    /*
     * Primera sincronización inmediata.
     */
    void sync(true);

    /*
     * Heartbeat:
     * mantiene viva la presencia aunque
     * watchPosition no emita nuevos puntos.
     */
    const interval = window.setInterval(() => {
      void sync(false);
    }, LOCATION_HEARTBEAT_MS);

    return () => {
      cancelled = true;

      window.clearInterval(interval);
    };
  }, [
    enabled,
    loading,
    user,
    latitude,
    longitude,
    accuracy,
  ]);

  return state;
}