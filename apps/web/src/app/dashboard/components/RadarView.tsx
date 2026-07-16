"use client";

import type {
  ProfileLink,
  ProfileRow,
} from "@lookup/services";

import { RadarCard } from "../../../components/radar-card";

type RadarViewProps = {
  profiles: ProfileRow[];
  links: Record<string, ProfileLink[]>;
  currentIndex: number;
  onSkip: () => void;
  onConnect: (id: string) => void;
};

export function RadarView({
  profiles,
  currentIndex,
  onSkip,
  onConnect,
}: RadarViewProps) {
  const profile = profiles[currentIndex];

  if (!profile) {
    return (
      <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-black">
          No hay personas cerca
        </h2>

        <p className="mt-3 text-slate-500">
          Cuando alguien entre en tu radio aparecerá aquí.
        </p>
      </div>
    );
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
        ""
      }
      active
      onSkip={onSkip}
      onConnect={() =>
        onConnect(profile.id)
      }
    />
  );
}