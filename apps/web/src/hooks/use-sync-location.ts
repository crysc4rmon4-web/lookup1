"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../components/auth-provider";

import { updateLocation } from "../services/location/update-location";

type Props = {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
};

type SyncLocationData = {
  ready: boolean;
  syncing: boolean;
  radarAllowed: boolean | null;
  error: string | null;
  lastSyncedAt: number | null;
};

type SyncLocationState = SyncLocationData & {
  syncNow: () => Promise<boolean>;
};

const LOCATION_HEARTBEAT_MS = 20_000;

const INITIAL_STATE: SyncLocationData = {
  ready: false,
  syncing: false,
  radarAllowed: null,
  error: null,
  lastSyncedAt: null,
};

export function useSyncLocation({
  enabled,
  latitude,
  longitude,
  accuracy,
  loading,
}: Props): SyncLocationState {
  const { user } = useAuth();

  const [state, setState] = useState<SyncLocationData>(INITIAL_STATE);

  const syncingRef = useRef(false);

  const radarAllowedRef = useRef<boolean | null>(null);

  const readyRef = useRef(false);

  const userId = user?.id ?? null;

  const syncNow = useCallback(async (): Promise<boolean> => {
    if (
      !enabled ||
      loading ||
      !userId ||
      latitude === null ||
      longitude === null
    ) {
      return false;
    }

    if (
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      setState((current) => ({
        ...current,
        ready: false,
        syncing: false,
        error:
          "Sin conexión. El Radar volverá a sincronizarse automáticamente.",
      }));

      readyRef.current = false;

      return false;
    }

    if (syncingRef.current) {
      return radarAllowedRef.current === true;
    }

    const currentLatitude = latitude;
    const currentLongitude = longitude;
    const currentAccuracy = accuracy;

    syncingRef.current = true;

    /*
     * La primera sincronización sí se muestra
     * visualmente.
     *
     * Heartbeats, focus y visibilitychange son
     * silenciosos mientras Radar ya esté listo,
     * evitando parpadeos ACTIVO → SINCRONIZANDO.
     */
    if (!readyRef.current) {
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

      radarAllowedRef.current = radarAllowed;
      readyRef.current = radarAllowed;

      setState({
        ready: radarAllowed,
        syncing: false,
        radarAllowed,
        error: null,
        lastSyncedAt: Date.now(),
      });

      return radarAllowed;
    } catch (error) {
      console.error("❌ Error sincronizando ubicación", error);

      radarAllowedRef.current = null;
      readyRef.current = false;

      setState((current) => ({
        ...current,
        ready: false,
        syncing: false,
        radarAllowed: null,
        error: "No pudimos sincronizar tu ubicación con el Radar.",
      }));

      return false;
    } finally {
      syncingRef.current = false;
    }
  }, [
    accuracy,
    enabled,
    latitude,
    loading,
    longitude,
    userId,
  ]);

  /*
   * ============================================================
   * RESET / ESPERA DE GPS
   * ============================================================
   */

  useEffect(() => {
    if (!enabled) {
      syncingRef.current = false;
      radarAllowedRef.current = null;
      readyRef.current = false;

      setState(INITIAL_STATE);

      return;
    }

    if (
      loading ||
      !userId ||
      latitude === null ||
      longitude === null
    ) {
      readyRef.current = false;

      setState((current) => ({
        ...current,
        ready: false,
        syncing: loading,
      }));
    }
  }, [
    enabled,
    latitude,
    loading,
    longitude,
    userId,
  ]);

  /*
   * ============================================================
   * PRIMERA SINCRONIZACIÓN + HEARTBEAT
   * ============================================================
   */

  useEffect(() => {
    if (
      !enabled ||
      loading ||
      !userId ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    void syncNow();

    const interval = window.setInterval(() => {
      void syncNow();
    }, LOCATION_HEARTBEAT_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    enabled,
    latitude,
    loading,
    longitude,
    syncNow,
    userId,
  ]);

  /*
   * ============================================================
   * REGRESO A LA APLICACIÓN
   * ============================================================
   */

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNow();
      }
    };

    const handleFocus = () => {
      void syncNow();
    };

    const handleOnline = () => {
      void syncNow();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener("focus", handleFocus);

    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener("focus", handleFocus);

      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, syncNow]);

  /*
   * ============================================================
   * PÉRDIDA DE CONEXIÓN
   * ============================================================
   */

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleOffline = () => {
      readyRef.current = false;

      setState((current) => ({
        ...current,
        ready: false,
        syncing: false,
        error:
          "Sin conexión. El Radar volverá a sincronizarse automáticamente.",
      }));
    };

    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [enabled]);

  return {
    ...state,
    syncNow,
  };
}