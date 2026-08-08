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
    if (!enabled) {
      return;
    }

    if (loading) {
      return;
    }

    if (!user) {
      return;
    }

    if (latitude === null || longitude === null) {
      return;
    }

    const userId = user.id;

    void updateLocation(
      userId,
      latitude,
      longitude,
      accuracy ?? undefined,
    ).catch((error) => {
      console.error(
        "❌ Error sincronizando ubicación:",
        error,
      );
    });
  }, [
    enabled,
    loading,
    user?.id,
    latitude,
    longitude,
    accuracy,
  ]);
}