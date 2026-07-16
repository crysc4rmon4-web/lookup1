"use client";

import { useEffect } from "react";

import { updateMyLocation } from "@lookup/services";

import { useAuth } from "../components/auth-provider";
import { useLocation } from "./use-location";

export function useSyncLocation() {
  const { user } = useAuth();

  const {
    latitude,
    longitude,
    accuracy,
    loading,
  } = useLocation();

  useEffect(() => {
    if (
      loading ||
      !user ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    void updateMyLocation(
      user.id,
      latitude,
      longitude,
      accuracy ?? undefined,
    );
  }, [
    user,
    latitude,
    longitude,
    accuracy,
    loading,
  ]);
}