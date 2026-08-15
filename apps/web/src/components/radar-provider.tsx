"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getRadarPresence,
  setRadarPresence,
} from "@lookup/services";

import { useAuth } from "./auth-provider";

import { useLocation } from "../hooks/use-location";
import { useSyncLocation } from "../hooks/use-sync-location";

type RadarPresenceContextValue = {
  enabled: boolean;
  requested: boolean;

  presenceLoading: boolean;
  toggleLoading: boolean;

  privacyBlocked: boolean;

  ready: boolean;

  locationLoading: boolean;
  locationSyncing: boolean;

  locationError: string | null;

  accuracy: number | null;

  lastSyncedAt: number | null;

  toggle: () => Promise<void>;
  disable: () => Promise<void>;
  syncNow: () => Promise<boolean>;
};

const RadarPresenceContext =
  createContext<RadarPresenceContextValue | null>(null);

export function RadarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const userId = user?.id ?? null;

  const [
    radarEnabled,
    setRadarEnabled,
  ] = useState(false);

  const [
    presenceLoading,
    setPresenceLoading,
  ] = useState(true);

  const [
    toggleLoading,
    setToggleLoading,
  ] = useState(false);

  const [
    privacyBlocked,
    setPrivacyBlocked,
  ] = useState(false);

  const toggleLoadingRef =
    useRef(false);

  /*
   * ============================================================
   * RECUPERAR ESTADO DE PRESENCIA
   * ============================================================
   *
   * El provider vive por encima de las rutas.
   *
   * Por tanto:
   *
   * Dashboard
   * → Perfil público
   * → Eventos
   * → Dashboard
   *
   * no desmontará el ciclo GPS/heartbeat.
   */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userId) {
      setRadarEnabled(false);
      setPrivacyBlocked(false);
      setPresenceLoading(false);

      return;
    }

    let cancelled = false;

    async function loadPresence() {
      setPresenceLoading(true);

      try {
        const enabled =
          await getRadarPresence();

        if (cancelled) {
          return;
        }

        setRadarEnabled(enabled);
      } catch (error) {
        console.error(
          "❌ Error cargando presencia del Radar",
          error,
        );

        if (!cancelled) {
          setRadarEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setPresenceLoading(false);
        }
      }
    }

    void loadPresence();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    userId,
  ]);

  /*
   * GPS solo cuando:
   *
   * - Auth ya terminó.
   * - Hay usuario.
   * - Recuperamos el estado inicial.
   * - Radar está encendido.
   */

  const requested =
    !authLoading &&
    Boolean(userId) &&
    !presenceLoading &&
    radarEnabled;

  const location =
    useLocation(requested);

  const locationSync =
    useSyncLocation({
      enabled: requested,

      latitude:
        location.latitude,

      longitude:
        location.longitude,

      accuracy:
        location.accuracy,

      loading:
        location.loading,
    });

  /*
   * Nunca exponemos errores internos
   * de Supabase/PostgreSQL.
   */

  const locationError =
    location.error ??
    (
      locationSync.error
        ? "No pudimos sincronizar tu ubicación con el Radar."
        : null
    );

  const ready =
    requested &&
    locationSync.ready &&
    !privacyBlocked &&
    locationError === null;

  /*
   * ============================================================
   * ZONAS PRIVADAS
   * ============================================================
   *
   * sync_radar_location() sigue siendo
   * la autoridad.
   *
   * false =
   * posición válida pero presencia
   * bloqueada por privacidad.
   */

  useEffect(() => {
    if (
      locationSync.radarAllowed === false
    ) {
      setPrivacyBlocked(true);

      setRadarEnabled(false);

      return;
    }

    if (
      locationSync.radarAllowed === true
    ) {
      setPrivacyBlocked(false);
    }
  }, [
    locationSync.radarAllowed,
  ]);

  /*
   * ============================================================
   * DESACTIVAR
   * ============================================================
   */

  const disable =
    useCallback(
      async () => {
        if (
          toggleLoadingRef.current
        ) {
          return;
        }

        if (!userId) {
          setRadarEnabled(false);
          setPrivacyBlocked(false);

          return;
        }

        toggleLoadingRef.current = true;

        setToggleLoading(true);

        try {
          /*
           * La RPC solo permite apagar.
           *
           * Nunca utilizamos
           * setRadarPresence(true).
           */

          await setRadarPresence(false);

          setRadarEnabled(false);
          setPrivacyBlocked(false);
        } finally {
          toggleLoadingRef.current = false;

          setToggleLoading(false);
        }
      },
      [
        userId,
      ],
    );

  /*
   * ============================================================
   * TOGGLE
   * ============================================================
   */

  const toggle =
    useCallback(
      async () => {
        if (
          toggleLoadingRef.current ||
          !userId
        ) {
          return;
        }

        if (radarEnabled) {
          await disable();

          return;
        }

        /*
         * ACTIVAR
         *
         * Cambiamos la intención local.
         *
         * useLocation obtiene GPS.
         *
         * useSyncLocation llama:
         *
         * sync_radar_location()
         *
         * y el servidor decide finalmente
         * si puede estar activo.
         */

        setPrivacyBlocked(false);

        setRadarEnabled(true);
      },
      [
        disable,
        radarEnabled,
        userId,
      ],
    );

  /*
   * ============================================================
   * CONTEXTO
   * ============================================================
   */

  const value =
    useMemo<RadarPresenceContextValue>(
      () => ({
        enabled:
          radarEnabled,

        requested,

        presenceLoading,

        toggleLoading,

        privacyBlocked,

        ready,

        locationLoading:
          location.loading,

        locationSyncing:
          locationSync.syncing,

        locationError,

        accuracy:
          location.accuracy,

        lastSyncedAt:
          locationSync.lastSyncedAt,

        toggle,

        disable,

        syncNow:
          locationSync.syncNow,
      }),
      [
        radarEnabled,
        requested,
        presenceLoading,
        toggleLoading,
        privacyBlocked,
        ready,
        location.loading,
        locationSync.syncing,
        locationSync.lastSyncedAt,
        locationSync.syncNow,
        locationError,
        location.accuracy,
        toggle,
        disable,
      ],
    );

  return (
    <RadarPresenceContext.Provider
      value={value}
    >
      {children}
    </RadarPresenceContext.Provider>
  );
}

export function useRadarPresence() {
  const context =
    useContext(
      RadarPresenceContext,
    );

  if (!context) {
    throw new Error(
      "useRadarPresence must be used within RadarProvider",
    );
  }

  return context;
}