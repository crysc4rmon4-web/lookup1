"use client";

import type { NearbyProfile } from "@lookup/types";

import { RadarCanvas } from "../../../components/RadarCanvas";

import { NearbyProfiles } from "./NearbyProfiles";
import { RadarTopBar } from "./RadarTopBar";

type RadarViewProps = {
  enabled: boolean;
  radarReady: boolean;
  privacyBlocked: boolean;

  toggleLoading: boolean;
  scanLoading: boolean;
  locationLoading: boolean;
  locationSyncing: boolean;

  locationError: string | null;
  accuracy: number | null;

  onToggle(): void;
  onRefresh(): Promise<void>;

  profiles: NearbyProfile[];
};

export function RadarView({
  enabled,
  radarReady,
  privacyBlocked,
  toggleLoading,
  scanLoading,
  locationLoading,
  locationSyncing,
  locationError,
  accuracy,
  onToggle,
  onRefresh,
  profiles,
}: RadarViewProps) {
  return (
    <section className="w-full space-y-5 pb-28">
      <div className="w-full overflow-hidden rounded-[2rem] border border-[#ECEFF5] bg-white p-4 shadow-sm sm:p-5">
        <RadarTopBar
          enabled={enabled}
          radarReady={radarReady}
          privacyBlocked={privacyBlocked}
          toggleLoading={toggleLoading}
          scanLoading={scanLoading}
          locationLoading={locationLoading}
          locationSyncing={locationSyncing}
          locationError={locationError}
          accuracy={accuracy}
          radius={25}
          nearbyCount={radarReady ? profiles.length : 0}
          onToggle={onToggle}
          onRefresh={onRefresh}
        />

        <div className="mt-6 flex w-full justify-center">
          <RadarCanvas
            enabled={enabled && radarReady && !privacyBlocked}
            profiles={radarReady && !privacyBlocked ? profiles : []}
          />
        </div>
      </div>

      <NearbyProfiles
        enabled={enabled}
        ready={radarReady}
        privacyBlocked={privacyBlocked}
        locationLoading={locationLoading || locationSyncing}
        locationError={locationError}
        profiles={profiles}
      />
    </section>
  );
}