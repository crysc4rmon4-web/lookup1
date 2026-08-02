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

  return (

    <section className="space-y-5">

      <div className="rounded-[2rem] border border-[#ECEFF5] bg-white p-5 shadow-sm">

        <RadarTopBar
          enabled={enabled}
          radius={25}
          nearbyCount={profiles.length}
          onToggle={onToggle}
          onRefresh={onRefresh}
        />

        <div className="mt-6">

          <RadarCanvas
            enabled={enabled}
            profiles={profiles}
          />

        </div>

      </div>

      <NearbyProfiles
        enabled={enabled}
        profiles={profiles}
      />

    </section>

  );

}