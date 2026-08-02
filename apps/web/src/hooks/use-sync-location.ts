"use client";

import { useEffect } from "react";

import { useAuth } from "../components/auth-provider";

import { updateLocation } from "../services/location/update-location";

import { useLocation } from "./use-location";

type Props = {
  enabled: boolean;
};

export function useSyncLocation({
  enabled,
}: Props) {
  const { user } = useAuth();

  const {
    latitude,
    longitude,
    accuracy,
    loading,
  } = useLocation();

  useEffect(() => {
    if (!enabled) {
      return;
    }

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
    user,
    latitude,
    longitude,
    accuracy,
    loading,
  ]);
}