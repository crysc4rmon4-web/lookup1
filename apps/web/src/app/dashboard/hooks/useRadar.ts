"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { NearbyProfile } from "@lookup/types";

import { useAuth } from "../../../components/auth-provider";

import { loadNearbyProfiles } from "../services/load-nearby-profiles";

type Props = {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
};

type RadarState = {
  profiles: NearbyProfile[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useRadar({
  enabled,
  latitude,
  longitude,
  loading: locationLoading,
}: Props): RadarState {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);

  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    /*
     * Radar apagado:
     * no mostramos ni consultamos personas.
     */
    if (!enabled) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    /*
     * Todavía no tenemos usuario o GPS.
     */
    if (!user || latitude === null || longitude === null) {
      setProfiles([]);

      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }

      return;
    }

    try {
      const nearby = await loadNearbyProfiles({
        currentUserId: user.id,

        latitude,

        longitude,
      });

      setProfiles(nearby);
    } catch (error) {
      console.error("❌ Error Radar", error);

      /*
       * Ante un error no mostramos
       * datos potencialmente obsoletos.
       */
      setProfiles([]);
    } finally {
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    }
  }, [enabled, user, latitude, longitude]);

  /*
   * Consulta inicial y cada vez que
   * cambia el estado del radar/GPS.
   */
  useEffect(() => {
    if (locationLoading) {
      return;
    }

    void refresh();
  }, [refresh, locationLoading]);

  /*
   * Mientras el radar está activo,
   * refrescamos presencia cada 5 segundos.
   */
  useEffect(() => {
    if (!enabled || !user || latitude === null || longitude === null) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, user, latitude, longitude, refresh]);

  /*
   * Si se apaga el radar, limpiamos
   * inmediatamente la UI.
   */
  useEffect(() => {
    if (!enabled) {
      setProfiles([]);
    }
  }, [enabled]);

  return {
    profiles,
    loading,
    refresh,
  };
}
