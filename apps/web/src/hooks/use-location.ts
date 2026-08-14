"use client";

import { useEffect, useState } from "react";

import {
  getCurrentLocation,
  normalizeLocationError,
  type LocationErrorCode,
  type UserLocation,
} from "../services/location/get-current-location";

import { stopWatchLocation } from "../services/location/stop-watch-location";

import { watchLocation } from "../services/location/watch-location";

type LocationState = {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  errorCode: LocationErrorCode | null;
};

export function useLocation(enabled: boolean) {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    errorCode: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        location: null,
        loading: false,
        error: null,
        errorCode: null,
      });

      return;
    }

    let cancelled = false;

    let watchId: number | null = null;

    setState({
      location: null,
      loading: true,
      error: null,
      errorCode: null,
    });

    async function initialize() {
      try {
        const location = await getCurrentLocation();

        if (cancelled) {
          return;
        }

        setState({
          location,
          loading: false,
          error: null,
          errorCode: null,
        });

        watchId = watchLocation(
          (nextLocation) => {
            if (cancelled) {
              return;
            }

            setState({
              location: nextLocation,
              loading: false,
              error: null,
              errorCode: null,
            });
          },

          (locationError) => {
            if (cancelled) {
              return;
            }

            /*
             * Un error real posterior al inicio
             * detiene la publicación de ubicación.
             *
             * TIMEOUT no llega aquí porque
             * watchLocation lo trata como recuperable.
             */
            setState({
              location: null,
              loading: false,
              error: locationError.message,
              errorCode: locationError.code,
            });
          },
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        const normalizedError = normalizeLocationError(error);

        setState({
          location: null,
          loading: false,
          error: normalizedError.message,
          errorCode: normalizedError.code,
        });
      }
    }

    void initialize();

    return () => {
      cancelled = true;

      if (watchId !== null) {
        stopWatchLocation(watchId);
      }
    };
  }, [enabled]);

  return {
    location: state.location,

    latitude: state.location?.latitude ?? null,

    longitude: state.location?.longitude ?? null,

    accuracy: state.location?.accuracy ?? null,

    loading: state.loading,

    error: state.error,

    errorCode: state.errorCode,
  };
}