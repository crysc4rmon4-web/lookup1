"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentLocation,
  type UserLocation,
} from "../services/location/get-current-location";

import { watchLocation } from "../services/location/watch-location";

import { stopWatchLocation } from "../services/location/stop-watch-location";

type LocationState = {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
};

export function useLocation() {
  const [state, setState] =
    useState<LocationState>({
      location: null,
      loading: true,
      error: null,
    });

  useEffect(() => {
    let watchId: number | null = null;

    async function initialize() {
      try {
        const location =
          await getCurrentLocation();

        setState({
          location,
          loading: false,
          error: null,
        });

        watchId =
          watchLocation(
            (nextLocation) => {
              setState({
                location:
                  nextLocation,
                loading: false,
                error: null,
              });
            },
          );
      } catch (error) {
        setState({
          location: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "No se pudo obtener la ubicación.",
        });
      }
    }

    void initialize();

    return () => {
      if (watchId !== null) {
        stopWatchLocation(
          watchId,
        );
      }
    };
  }, []);

  return {
    location: state.location,

    latitude:
      state.location?.latitude ??
      null,

    longitude:
      state.location?.longitude ??
      null,

    accuracy:
      state.location?.accuracy ??
      null,

    loading: state.loading,

    error: state.error,
  };
}