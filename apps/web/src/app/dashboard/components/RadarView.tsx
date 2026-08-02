"use client";

import type {
  NearbyProfile,
} from "@lookup/types";

import { RadarCanvas } from "../../../components/RadarCanvas";

import { NearbyProfiles } from "./NearbyProfiles";
import { RadarTopBar } from "./RadarTopBar";

type RadarViewProps = {
  enabled: boolean;
  onToggle(): void;
  onRefresh(): Promise<void>;

  profiles: NearbyProfile[];
};
export function RadarView({
  enabled,
  onToggle,
  onRefresh,
  profiles,
}: RadarViewProps) {

  const profile =
    profiles[0];

  
  return (

    <div className="space-y-6">

      <RadarTopBar
        enabled={enabled}
        radius={25}
        nearbyCount={profiles.length}
        onToggle={onToggle}
        onRefresh={onRefresh}
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

        <>

          <RadarCanvas
            enabled={enabled}
            profiles={profiles}
          />

          <NearbyProfiles
            enabled={enabled}
            profiles={profiles}
          />

        </>

      )}

    </div>

  );
}