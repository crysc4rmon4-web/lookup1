"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentLocation,
  normalizeLocationError,
  type LocationError,
  type LocationErrorCode,
  type UserLocation,
} from "../services/location/get-current-location";

import {
  stopWatchLocation,
} from "../services/location/stop-watch-location";

import {
  watchLocation,
} from "../services/location/watch-location";

type LocationState = {
  location: UserLocation | null;

  loading: boolean;

  error: string | null;

  errorCode:
    | LocationErrorCode
    | null;
};

const INITIAL_STATE: LocationState = {
  location: null,
  loading: false,
  error: null,
  errorCode: null,
};

function isRecoverableLocationError(
  error: LocationError,
) {
  return (
    error.code === "timeout" ||
    error.code ===
      "position_unavailable"
  );
}

export function useLocation(
  enabled: boolean,
) {
  const [
    state,
    setState,
  ] =
    useState<LocationState>(
      INITIAL_STATE,
    );

  useEffect(() => {
    if (!enabled) {
      setState(
        INITIAL_STATE,
      );

      return;
    }

    let cancelled = false;

    let watchId:
      | number
      | null = null;

    /*
     * ============================================================
     * POSICIÓN VÁLIDA
     * ============================================================
     */

    function applyLocation(
      location: UserLocation,
    ) {
      if (cancelled) {
        return;
      }

      setState({
        location,

        loading: false,

        error: null,

        errorCode: null,
      });
    }

    /*
     * ============================================================
     * ERROR DE WATCH
     * ============================================================
     *
     * Timeout y position_unavailable
     * pueden ser temporales.
     *
     * No destruimos Radar ni obligamos
     * al usuario a hacer F5.
     */

    function applyWatchError(
      locationError: LocationError,
    ) {
      if (cancelled) {
        return;
      }

      if (
        isRecoverableLocationError(
          locationError,
        )
      ) {
        setState(
          (current) => {
            /*
             * Si ya tenemos una posición,
             * conservamos la última fijación
             * mientras watchPosition intenta
             * recuperarse.
             */

            if (
              current.location
            ) {
              return current;
            }

            return {
              location: null,

              loading: true,

              error: null,

              errorCode: null,
            };
          },
        );

        return;
      }

      /*
       * permission_denied,
       * unsupported o error real.
       */

      setState({
        location: null,

        loading: false,

        error:
          locationError.message,

        errorCode:
          locationError.code,
      });
    }

    setState({
      location: null,

      loading: true,

      error: null,

      errorCode: null,
    });

    /*
     * ============================================================
     * WATCH PRIMERO
     * ============================================================
     *
     * Antes esperábamos a que
     * getCurrentPosition() terminara.
     *
     * Si ese intento hacía timeout,
     * nunca llegábamos a crear el watch.
     *
     * Ahora watchPosition empieza desde
     * el primer momento y puede recuperar
     * automáticamente una fijación.
     */

    try {
      watchId =
        watchLocation(
          applyLocation,
          applyWatchError,
        );
    } catch (error) {
      const normalizedError =
        normalizeLocationError(
          error,
        );

      applyWatchError(
        normalizedError,
      );
    }

    /*
     * getCurrentPosition sigue siendo útil
     * porque suele ofrecer una primera
     * respuesta rápida/cacheada.
     *
     * Pero ya no es el único camino.
     */

    async function initialize() {
      try {
        const location =
          await getCurrentLocation();

        applyLocation(
          location,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        const normalizedError =
          normalizeLocationError(
            error,
          );

        /*
         * Timeout o posición temporalmente
         * no disponible:
         *
         * watchPosition sigue vivo.
         */

        if (
          isRecoverableLocationError(
            normalizedError,
          )
        ) {
          setState(
            (current) => {
              if (
                current.location
              ) {
                return current;
              }

              return {
                location: null,

                loading: true,

                error: null,

                errorCode: null,
              };
            },
          );

          return;
        }

        applyWatchError(
          normalizedError,
        );
      }
    }

    void initialize();

    return () => {
      cancelled = true;

      if (
        watchId !== null
      ) {
        stopWatchLocation(
          watchId,
        );
      }
    };
  }, [
    enabled,
  ]);

  return {
    location:
      state.location,

    latitude:
      state.location
        ?.latitude ??
      null,

    longitude:
      state.location
        ?.longitude ??
      null,

    accuracy:
      state.location
        ?.accuracy ??
      null,

    loading:
      state.loading,

    error:
      state.error,

    errorCode:
      state.errorCode,
  };
}