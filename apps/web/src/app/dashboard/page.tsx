"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BottomNav } from "../../components/bottom-nav";
import { useAuth } from "../../components/auth-provider";

import { DashboardHeader } from "./components/DashboardHeader";
import { RadarView } from "./components/RadarView";
import {
  EventsView,
  type EventCard,
} from "./components/EventsView";
import { SettingsView } from "./components/SettingsView";

import { useProfileStatus } from "../../hooks/use-profile-status";
import { useRadar } from "./hooks/useRadar";

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

  const {
    profiles,
    links,
    profilesLoading,
  } = useRadar();

  const [section, setSection] =
    useState<Section>("radar");

  const [profileVisible, setProfileVisible] =
    useState(true);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  useEffect(() => {
    if (loading) return;

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

  useEffect(() => {
    if (
      currentIndex >= profiles.length &&
      profiles.length > 0
    ) {
      setCurrentIndex(0);
    }
  }, [
    currentIndex,
    profiles.length,
  ]);

  const profileLinks = useMemo(() => {
    if (!profile) return [];

    return links[profile.id] ?? [];
  }, [links, profile]);

  const events: EventCard[] = [];

  function handleSkip() {
    if (profiles.length === 0) return;

    setCurrentIndex((current) =>
      current + 1 >= profiles.length
        ? 0
        : current + 1,
    );
  }

  function handleConnect() {
    const current =
      profiles[currentIndex];

    if (!current) return;

    console.log(
      "Connect",
      current.id,
    );
  }

  if (
    loading ||
    profilesLoading ||
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
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-4 pb-28">
      <section className="mx-auto flex w-full max-w-[430px] flex-col gap-5">

        <DashboardHeader
          section={section}
          profileVisible={profileVisible}
          onToggleVisibility={() =>
            setProfileVisible((v) => !v)
          }
        />
                {section === "radar" && (
          <RadarView
            profiles={profiles}
            links={links}
            currentIndex={currentIndex}
            onSkip={handleSkip}
            onConnect={handleConnect}
          />
        )}

        {section === "events" && (
          <EventsView
            events={events}
            onCreateEvent={() =>
              console.log("Crear evento")
            }
            onJoinEvent={(id) =>
              console.log("Unirse", id)
            }
          />
        )}

        {section === "settings" && (
          <SettingsView
            profile={profile}
            links={profileLinks}
            profileVisible={profileVisible}
            onToggleVisibility={() =>
              setProfileVisible((v) => !v)
            }
            onEditProfile={() =>
              router.push("/onboarding")
            }
            onLogout={async () => {
              await signOut();
              router.replace("/login/signup");
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