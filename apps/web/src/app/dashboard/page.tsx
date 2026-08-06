"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getProfileLinks,
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
  } =
    useProfileStatus();

  /*
   * ÚNICA instancia de geolocalización
   * Toda la aplicación compartirá este estado.
   */
  const location =
    useLocation();

  const {
    profiles,
    loading: radarLoading,
    refresh,
  } =
    useRadar({

      latitude:
        location.latitude,

      longitude:
        location.longitude,

      loading:
        location.loading,

    });

  const [section, setSection] =
    useState<Section>("radar");

  const [
    radarEnabled,
    setRadarEnabled,
  ] =
    useState(true);

  const [
    profileVisible,
    setProfileVisible,
  ] =
    useState(true);

  const [
    profileLinks,
    setProfileLinks,
  ] =
    useState<ProfileLink[]>([]);

  useSyncLocation({

    enabled:
      radarEnabled,

    latitude:
      location.latitude,

    longitude:
      location.longitude,

    accuracy:
      location.accuracy,

    loading:
      location.loading,

  });

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

  useEffect(() => {

    async function loadLinks() {

      if (!profile) {
        return;
      }

      const links =
        await getProfileLinks(
          profile.id,
        );

      setProfileLinks(
        links ?? [],
      );

    }

    void loadLinks();

  }, [profile]);

  const events: EventCard[] = [];

  if (

    loading ||
    radarLoading ||
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
              onToggle={() =>
                setRadarEnabled(
                  (value) => !value,
                )
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
            profileVisible={profileVisible}
            onToggleVisibility={() =>
              setProfileVisible(
                (value) => !value,
              )
            }
            onEditProfile={() =>
              router.push(
                "/profile/edit",
              )
            }
            onLogout={async () => {

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