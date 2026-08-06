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

export function useSyncLocation({
  enabled,
  latitude,
  longitude,
  accuracy,
  loading,
}: Props) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    if (
      loading ||
      !user ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    void updateLocation(
      user.id,
      latitude,
      longitude,
      accuracy ?? undefined,
    );
  }, [
    enabled,
    loading,
    user,
    latitude,
    longitude,
    accuracy,
  ]);
}