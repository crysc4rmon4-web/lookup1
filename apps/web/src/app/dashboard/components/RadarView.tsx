"use client";

import { useState } from "react";

import type {
  ProfileLink,
  ProfileRow,
} from "@lookup/services";

import { RadarCanvas } from "../../../components/RadarCanvas";

import { RadarTopBar } from "./RadarTopBar";

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

  const [enabled, setEnabled] =
    useState(true);

  const profile =
    profiles[currentIndex];

  function refreshRadar() {
    console.log(
      "Radar scan...",
    );
  }

  return (

    <div className="space-y-6">

      <RadarTopBar
        enabled={enabled}
        radius={25}
        nearbyCount={profiles.length}
        onToggle={() =>
          setEnabled(
            (value) => !value,
          )
        }
        onRefresh={
          refreshRadar
        }
      />

      {!profile && (

        <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">

          <h2 className="text-2xl font-black">

            No hay personas cerca

          </h2>

          <p className="mt-3 text-slate-500">

            Cuando alguien entre en tu radio aparecerá aquí.

          </p>

        </div>

      )}

      {enabled && (

        <RadarCanvas
          enabled={enabled}
        />

      )}

    </div>

  );
}