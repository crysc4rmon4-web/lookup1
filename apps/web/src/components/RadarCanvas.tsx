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

    const distance =
      Math.min(
        profiles[index]?.distance ?? 25,
        25,
      );

    const radius =
      35 +
      (distance / 25) * 85;

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

    <section className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center overflow-hidden rounded-full border border-[#D9DEFF] bg-gradient-to-b from-white via-[#FBFBFE] to-[#F4F6FB]">

      {enabled && (

        <>

          <div className="absolute h-16 w-16 rounded-full border border-[#5D5FEF]/20 animate-ping" />

          <div
            className="absolute h-36 w-36 rounded-full border border-[#5D5FEF]/10"
            style={{
              animation:
                "ping 3s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />

          <div
            className="absolute h-60 w-60 rounded-full border border-[#5D5FEF]/10"
            style={{
              animation:
                "ping 4.5s cubic-bezier(0,0,0.2,1) infinite",
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

            const intensity =
              1 -
              (profile.distance / 25);

            const size =
              10 +
              intensity * 8;

            return (

              <div
                key={profile.id}
                className="absolute transition-all duration-500"
                style={{
                  left: position.left,
                  top: position.top,
                }}
              >

                <span
                  className="absolute rounded-full bg-[#EF4444]/20 animate-ping"
                  style={{
                    width: size + 12,
                    height: size + 12,
                    left: -(size + 12) / 2,
                    top: -(size + 12) / 2,
                  }}
                />

                <span
                  className="relative block rounded-full bg-[#EF4444] transition-all"
                  style={{
                    width: size,
                    height: size,
                    boxShadow:
                      `0 0 ${
                        10 +
                        intensity * 16
                      }px rgba(239,68,68,.55)`,
                  }}
                />

              </div>

            );

          },

        )}

      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#5D5FEF] shadow-[0_0_28px_rgba(93,95,239,.45)]">

        <span className="h-4 w-4 rounded-full bg-white" />

      </div>

    </section>

  );

}