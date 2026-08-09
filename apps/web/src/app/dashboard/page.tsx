"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getProfileLinks,
  getRadarPresence,
  setRadarPresence,
  type ProfileLink,
} from "@lookup/services";

import { BottomNav } from "../../components/bottom-nav";
import { useAuth } from "../../components/auth-provider";

import { useLocation } from "../../hooks/use-location";
import { useProfileStatus } from "../../hooks/use-profile-status";
import { useSyncLocation } from "../../hooks/use-sync-location";

import { useRadar } from "./hooks/useRadar";

import { DashboardHeader } from "./components/DashboardHeader";
import { RadarView } from "./components/RadarView";

import {
  EventsView,
  type EventCard,
} from "./components/EventsView";

import { SettingsView } from "./components/SettingsView";

type Section =
  | "radar"
  | "events"
  | "settings";

export default function DashboardPage() {
  const router =
    useRouter();

  const { signOut } =
    useAuth();

  const {
    user,
    profile,
    loading,
    needsOnboarding,
  } = useProfileStatus();

  /*
   * ÚNICA instancia de geolocalización.
   * Toda la aplicación comparte este estado.
   */
  const location =
    useLocation();

  /*
   * El estado inicial es OFF por seguridad.
   *
   * Después consultamos Supabase y recuperamos
   * el estado real del usuario.
   */
  const [
    radarEnabled,
    setRadarEnabled,
  ] = useState(false);

  const [
    radarPresenceLoading,
    setRadarPresenceLoading,
  ] = useState(true);

  const [
    profileVisible,
    setProfileVisible,
  ] = useState(true);

  const [
    profileLinks,
    setProfileLinks,
  ] = useState<ProfileLink[]>([]);

  const [
    section,
    setSection,
  ] = useState<Section>("radar");

  /*
   * Recuperamos el estado real del radar
   * desde Supabase después de tener usuario.
   */
  useEffect(() => {
    if (
      loading ||
      !user
    ) {
      return;
    }

    let mounted = true;

    async function loadRadarPresence() {
      try {
        const enabled =
          await getRadarPresence();

        if (mounted) {
          setRadarEnabled(
            enabled,
          );
        }
      } catch (error) {
        console.error(
          "❌ Error cargando presencia del radar",
          error,
        );

        /*
         * Fail-safe:
         * si no podemos determinar el estado,
         * el radar queda apagado.
         */
        if (mounted) {
          setRadarEnabled(false);
        }
      } finally {
        if (mounted) {
          setRadarPresenceLoading(
            false,
          );
        }
      }
    }

    void loadRadarPresence();

    return () => {
      mounted = false;
    };
  }, [
    loading,
    user,
  ]);

  const {
    profiles,
    refresh,
  } = useRadar({
    enabled:
      radarEnabled &&
      !radarPresenceLoading,

    latitude:
      location.latitude,

    longitude:
      location.longitude,

    loading:
      location.loading,
  });

  /*
   * Sincronización de ubicación + presencia.
   *
   * Este hook es quien comunica el estado
   * ON/OFF real con Supabase.
   */
  useSyncLocation({
    enabled:
      radarEnabled &&
      !radarPresenceLoading,

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
   * Protección de rutas.
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(
        "/login",
      );

      return;
    }

    if (needsOnboarding) {
      router.replace(
        "/onboarding",
      );
    }
  }, [
    loading,
    user,
    needsOnboarding,
    router,
  ]);

  /*
   * Carga de enlaces del perfil.
   */
  useEffect(() => {
    async function loadLinks() {
      if (!profile) {
        return;
      }

      try {
        const links =
          await getProfileLinks(
            profile.id,
          );

        setProfileLinks(
          links ?? [],
        );
      } catch (error) {
        console.error(
          "❌ Error cargando enlaces del perfil",
          error,
        );

        setProfileLinks([]);
      }
    }

    void loadLinks();
  }, [profile]);

  const events: EventCard[] = [];

  /*
   * Estado de carga general.
   */
  if (
    loading ||
    radarPresenceLoading ||
    !user
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Cargando...
        </p>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  /*
   * El toggle solo cambia estado local.
   *
   * useSyncLocation es la única capa encargada
   * de sincronizar la presencia con Supabase.
   */
  const handleRadarToggle =
    () => {
      setRadarEnabled(
        (value) => !value,
      );
    };

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-4 py-5 pb-28">
      <section className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        {section === "radar" ? (
          <div className="space-y-2">
            <DashboardHeader
              section={section}
            />

            <RadarView
              enabled={radarEnabled}
              onToggle={
                handleRadarToggle
              }
              profiles={profiles}
              onRefresh={refresh}
            />
          </div>
        ) : (
          <DashboardHeader
            section={section}
          />
        )}

        {section === "events" && (
          <EventsView
            events={events}
            onCreateEvent={() =>
              console.log(
                "Crear evento",
              )
            }
            onJoinEvent={(id) =>
              console.log(
                "Unirse",
                id,
              )
            }
          />
        )}

        {section === "settings" && (
          <SettingsView
            profile={profile}
            links={profileLinks}
            profileVisible={
              profileVisible
            }
            onToggleVisibility={() =>
              setProfileVisible(
                (value) =>
                  !value,
              )
            }
            onEditProfile={() =>
              router.push(
                "/profile/edit",
              )
            }
            onLogout={async () => {
              /*
               * Antes de cerrar sesión,
               * dejamos de estar presentes.
               */
              try {
                await setRadarPresence(
                  false,
                );
              } catch (error) {
                console.error(
                  "❌ Error apagando radar antes de cerrar sesión",
                  error,
                );
              }

              await signOut();

              router.replace(
                "/login/signup",
              );
            }}
          />
        )}
      </section>

      <BottomNav
        active={section}
        onChange={setSection}
      />
    </main>
  );
}