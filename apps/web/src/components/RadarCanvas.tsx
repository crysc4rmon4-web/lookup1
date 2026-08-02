"use client";

import type {
  NearbyProfile,
} from "@lookup/types";

type Props = {
  enabled: boolean;
  profiles: NearbyProfile[];
};

export function RadarCanvas({
  enabled,
  profiles,
}: Props) {

  function getPosition(
    index: number,
  ) {

    const total =
      Math.max(
        profiles.length,
        1,
      );

    const angle =
      (360 / total) *
      index;

    const radians =
      (angle * Math.PI) / 180;

    const radius = 82;

    return {

      left:
        150 +
        Math.cos(radians) *
        radius,

      top:
        150 +
        Math.sin(radians) *
        radius,

    };

  }

  return (

    <section className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center overflow-hidden rounded-full border border-[#D9DEFF] bg-gradient-to-b from-white to-[#F7F8FC]">

      {enabled && (
        <>
          <div className="absolute h-16 w-16 animate-ping rounded-full border border-[#5D5FEF]/20" />

          <div
            className="absolute h-36 w-36 rounded-full border border-[#5D5FEF]/10"
            style={{
              animation:
                "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />

          <div
            className="absolute h-60 w-60 rounded-full border border-[#5D5FEF]/10"
            style={{
              animation:
                "ping 4s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
        </>
      )}

      <div className="absolute h-[120px] w-px bg-[#EEF2FF]" />
      <div className="absolute h-px w-[120px] bg-[#EEF2FF]" />

      <div className="absolute h-32 w-32 rounded-full border border-[#EEF2FF]" />
      <div className="absolute h-56 w-56 rounded-full border border-[#EEF2FF]" />

      {enabled &&
        profiles.map(
          (profile, index) => {

            const position =
              getPosition(index);

            return (

              <div
                key={profile.id}
                className="absolute"
                style={{
                  left: position.left,
                  top: position.top,
                }}
              >

                <span className="absolute -left-3 -top-3 h-6 w-6 animate-ping rounded-full bg-red-500/20" />

                <span className="relative block h-3.5 w-3.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,.55)]" />

              </div>

            );

          },
        )}

      <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#5D5FEF] shadow-[0_0_25px_rgba(93,95,239,.45)]">

        <span className="h-3 w-3 rounded-full bg-white" />

      </div>

    </section>
  );
}