"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  NearbyProfile,
} from "@lookup/types";

import { useAuth } from "../../../components/auth-provider";
import { useLocation } from "../../../hooks/use-location";

import { loadNearbyProfiles } from "../services/load-nearby-profiles";

type RadarState = {
  profiles: NearbyProfile[];
  loading: boolean;
  refresh(): Promise<void>;
};

export function useRadar(): RadarState {

  const { user } =
    useAuth();

  const {
    latitude,
    longitude,
    loading: locationLoading,
  } =
    useLocation();

  const [
    profiles,
    setProfiles,
  ] =
    useState<NearbyProfile[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const refresh =
    useCallback(async () => {

      if (
        !user ||
        latitude === null ||
        longitude === null
      ) {

        console.log(
          "⛔ Radar cancelado",
        );

        setProfiles([]);
        setLoading(false);

        return;

      }

      try {

        setLoading(true);

        console.group("🛰️ Radar Refresh");

        console.log("Usuario:", user.id);

        console.log("Posición:", {
          latitude,
          longitude,
        });

        const nearby =
          await loadNearbyProfiles({

            currentUserId:
              user.id,

            latitude,

            longitude,

          });

        console.log(
          "Perfiles recibidos:",
          nearby,
        );

        console.log(
          "Cantidad:",
          nearby.length,
        );

        setProfiles(
          nearby,
        );

        console.log(
          "Estado actualizado",
        );

        console.groupEnd();

      } catch (error) {

        console.error(
          "❌ Error Radar",
          error,
        );

      } finally {

        setLoading(false);

      }

    }, [

      user,

      latitude,

      longitude,

    ]);

  useEffect(() => {

    if (locationLoading) {
      return;
    }

    void refresh();

  }, [

    refresh,

    locationLoading,

  ]);

  return {

    profiles,

    loading,

    refresh,

  };

}