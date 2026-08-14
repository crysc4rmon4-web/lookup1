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
  refresh: () => Promise<void>;
};

const RADAR_REFRESH_MS = 5_000;

export function useRadar({
  enabled,
  ready,
}: Props): RadarState {
  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);

  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !ready) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      const nearby = await loadNearbyProfiles();

      setProfiles(nearby);
    } catch (error) {
      console.error("❌ Error cargando Radar", error);

      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, ready]);

  useEffect(() => {
    if (!enabled || !ready) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    void refresh();
  }, [enabled, ready, refresh]);

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

  return {
    profiles,
    loading,
    refresh,
  };
}