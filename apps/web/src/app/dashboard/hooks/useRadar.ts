"use client";

import { useCallback, useEffect, useState } from "react";

import type { NearbyProfile } from "@lookup/types";

import { loadNearbyProfiles } from "../services/load-nearby-profiles";

type Props = {
  enabled: boolean;
  ready: boolean;
};

type RadarState = {
  profiles: NearbyProfile[];
  loading: boolean;
  lastUpdatedAt: number | null;
  refresh: () => Promise<void>;
};

const RADAR_REFRESH_MS = 5_000;

export function useRadar({
  enabled,
  ready,
}: Props): RadarState {
  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);

  const [loading, setLoading] = useState(false);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !ready) {
      setProfiles([]);
      setLoading(false);

      return;
    }

    /*
     * Evitamos errores repetitivos mientras
     * el dispositivo está sin conexión.
     */
    if (
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      return;
    }

    try {
      const nearby = await loadNearbyProfiles();

      setProfiles(nearby);

      setLastUpdatedAt(Date.now());
    } catch (error) {
      /*
       * Si la conexión desapareció durante
       * la petición no ensuciamos la consola.
       */
      if (
        typeof navigator !== "undefined" &&
        navigator.onLine === false
      ) {
        return;
      }

      console.error("❌ Error cargando Radar", error);

      /*
       * Ante un error real no conservamos
       * resultados potencialmente obsoletos.
       */
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, ready]);

  /*
   * Primer escaneo.
   */
  useEffect(() => {
    if (!enabled || !ready) {
      setProfiles([]);
      setLoading(false);

      return;
    }

    setLoading(true);

    void refresh();
  }, [enabled, ready, refresh]);

  /*
   * Escaneo periódico mientras Radar
   * permanece operativo.
   */
  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, RADAR_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, ready, refresh]);

  /*
   * Al regresar a la pestaña hacemos
   * un nuevo escaneo inmediatamente.
   */
  useEffect(() => {
    if (!enabled || !ready) {
      return;
    }

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const handleFocus = () => {
      void refresh();
    };

    const handleOnline = () => {
      void refresh();
    };

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, ready, refresh]);

  return {
    profiles,
    loading,
    lastUpdatedAt,
    refresh,
  };
}