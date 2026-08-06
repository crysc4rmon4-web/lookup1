"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  NearbyProfile,
} from "@lookup/types";

import { useAuth } from "../../../components/auth-provider";

import { loadNearbyProfiles } from "../services/load-nearby-profiles";

type Props = {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
};

type RadarState = {
  profiles: NearbyProfile[];
  loading: boolean;
  refresh(): Promise<void>;
};

export function useRadar({
  latitude,
  longitude,
  loading: locationLoading,
}: Props): RadarState {

  const { user } =
    useAuth();

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

  const initialized =
    useRef(false);

  const refresh =
    useCallback(async () => {

      if (
        !user ||
        latitude === null ||
        longitude === null
      ) {
        return;
      }

      try {

        const nearby =
          await loadNearbyProfiles({

            currentUserId:
              user.id,

            latitude,

            longitude,

          });

        setProfiles(nearby);

      } catch (error) {

        console.error(
          "❌ Error Radar",
          error,
        );

      } finally {

        if (!initialized.current) {

          initialized.current = true;

          setLoading(false);

        }

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

  useEffect(() => {

    if (
      !user ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {

        void refresh();

      }, 5000);

    return () =>
      clearInterval(interval);

  }, [

    refresh,
    user,
    latitude,
    longitude,

  ]);

  return {

    profiles,

    loading,

    refresh,

  };

}