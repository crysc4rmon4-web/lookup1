"use client";

import { RadarCard } from "../../../components/radar-card";
import type { ProfileRow } from "@lookup/services";

type RadarViewProps = {
  profiles: ProfileRow[];
  currentIndex: number;
  onSkip: () => void;
  onConnect: () => void;
};

export function RadarView({
  profiles,
  currentIndex,
  onSkip,
  onConnect,
}: RadarViewProps) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-center text-slate-500">
          No hay personas cerca por ahora.
        </p>
      </div>
    );
  }

  const profile =
    profiles[currentIndex] ?? profiles[0];

  if (!profile) {
    return null;
  }

  return (
    <RadarCard
      id={profile.id}
      name={
        profile.full_name ??
        profile.username ??
        "Usuario"
      }
      profession={
        profile.profession ??
        "Profesional"
      }
      city={
        profile.city ??
        "Sin ciudad"
      }
      bio={
        profile.bio ??
        "Todavía no ha escrito una presentación."
      }
      onSkip={onSkip}
      onConnect={onConnect}
      active
    />
  );
}