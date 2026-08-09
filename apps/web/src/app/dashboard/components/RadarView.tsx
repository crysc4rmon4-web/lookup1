"use client";

import type {
  NearbyProfile,
} from "@lookup/types";

import { RadarCanvas } from "../../../components/RadarCanvas";

import { NearbyProfiles } from "./NearbyProfiles";
import { RadarTopBar } from "./RadarTopBar";

type RadarViewProps = {
  enabled: boolean;
  toggleLoading: boolean;
  onToggle(): void;
  onRefresh(): Promise<void>;
  profiles: NearbyProfile[];
};

export function RadarView({
  enabled,
  toggleLoading,
  onToggle,
  onRefresh,
  profiles,
}: RadarViewProps) {
  return (
    <section className="w-full space-y-5">
      <div
        className="
          w-full
          overflow-hidden
          rounded-[2rem]
          border
          border-[#ECEFF5]
          bg-white
          p-4
          shadow-sm
          sm:p-5
        "
      >
        <RadarTopBar
          enabled={enabled}
          toggleLoading={toggleLoading}
          radius={25}
          nearbyCount={profiles.length}
          onToggle={onToggle}
          onRefresh={onRefresh}
        />

        <div className="mt-6 flex w-full justify-center">
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