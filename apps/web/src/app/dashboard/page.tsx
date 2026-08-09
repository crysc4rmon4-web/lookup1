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
  const router = useRouter();

  const { signOut } = useAuth();

  const {
    user,
    profile,
    loading,
    needsOnboarding,
  } = useProfileStatus();

  /*
   * ÚNICA instancia de geolocalización.
   * Toda la aplicación comparte esta ubicación.
   */
  const location = useLocation();

  /*
   * Estado local del radar.
   *
   * Arranca OFF por seguridad.
   * Después recuperamos el estado real desde Supabase.
   */
  const [
    radarEnabled,
    setRadarEnabled,
  ] = useState(false);

  const [
    radarPresenceLoading,
    setRadarPresenceLoading,
  ] = useState(true);

  /*
   * Evita múltiples cambios simultáneos
   * del toggle mientras Supabase responde.
   */
  const [
    radarToggleLoading,
    setRadarToggleLoading,
  ] = useState(false);

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
   * Recuperamos el estado real de presencia
   * desde Supabase una vez autenticado el usuario.
   */
  useEffect(() => {
    if (loading || !user) {
      return;
    }

    let mounted = true;

    async function loadRadarPresence() {
      try {
        const enabled =
          await getRadarPresence();

        if (mounted) {
          setRadarEnabled(enabled);
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
          setRadarPresenceLoading(false);
        }
      }
    }

    void loadRadarPresence();

    return () => {
      mounted = false;
    };
  }, [loading, user]);

  /*
   * Radar:
   *
   * Solo consulta perfiles cuando:
   * - el usuario está autenticado
   * - el radar está activo
   * - la presencia ya fue cargada
   * - existe una ubicación válida
   */
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
   * Sincronización de ubicación.
   *
   * Mientras el radar está activo,
   * actualizamos la ubicación del usuario.
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
      router.replace("/login");
      return;
    }

    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [
    loading,
    user,
    needsOnboarding,
    router,
  ]);

  /*
   * Carga de enlaces del perfil.
   *
   * Guardamos el ID antes de entrar
   * en la operación asíncrona para que
   * TypeScript pueda garantizar que existe.
   */
  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId = profile.id;

    let mounted = true;

    async function loadLinks() {
      try {
        const links =
          await getProfileLinks(
            profileId,
          );

        if (mounted) {
          setProfileLinks(
            links ?? [],
          );
        }
      } catch (error) {
        console.error(
          "❌ Error cargando enlaces del perfil",
          error,
        );

        if (mounted) {
          setProfileLinks([]);
        }
      }
    }

    void loadLinks();

    return () => {
      mounted = false;
    };
  }, [profile]);

  /*
   * Eventos:
   *
   * Contrato preparado para el siguiente sprint.
   */
  const events: EventCard[] = [];

  /*
   * Cambio real de presencia.
   *
   * Primero persistimos en Supabase.
   * Solo si Supabase confirma el cambio
   * modificamos el estado visual local.
   */
  const handleRadarToggle =
    async () => {
      if (
        radarToggleLoading ||
        !user
      ) {
        return;
      }

      const nextEnabled =
        !radarEnabled;

      setRadarToggleLoading(true);

      try {
        await setRadarPresence(
          nextEnabled,
        );

        setRadarEnabled(
          nextEnabled,
        );
      } catch (error) {
        console.error(
          "❌ Error cambiando presencia del radar",
          error,
        );
      } finally {
        setRadarToggleLoading(false);
      }
    };

  /*
   * Estado de carga general.
   */
  if (
    loading ||
    radarPresenceLoading ||
    !user
  ) {
    return null;
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FC]">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-24 pt-4">
        {section === "radar" ? (
          <RadarView
            enabled={radarEnabled}
            toggleLoading={
              radarToggleLoading
            }
            onToggle={
              handleRadarToggle
            }
            profiles={profiles}
            onRefresh={refresh}
          />
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
               * eliminamos la presencia del radar.
               */
              try {
                await setRadarPresence(
                  false,
                );

                setRadarEnabled(
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

        <BottomNav
          active={section}
          onChange={(nextSection) =>
            setSection(
              nextSection as Section,
            )
          }
        />
      </section>
    </main>
  );
}