"use client";

import type {
  NearbyProfile,
} from "@lookup/types";

type Props = {
  enabled: boolean;
  profiles: NearbyProfile[];
};

const MAX_RADIUS = 25;
const CANVAS_SIZE = 340;
const CENTER = CANVAS_SIZE / 2;

export function RadarCanvas({
  enabled,
  profiles,
}: Props) {

  function getPosition(
    profile: NearbyProfile,
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
        profile.distance,
        MAX_RADIUS,
      );

    const radius =
      28 +
      (distance / MAX_RADIUS) * 120;

    return {

      left:
        CENTER +
        Math.cos(radians) *
        radius,

      top:
        CENTER +
        Math.sin(radians) *
        radius,

    };

  }

  return (

    <section
      className="
        relative
        mx-auto
        flex
        h-[340px]
        w-[340px]
        items-center
        justify-center
        overflow-hidden
        rounded-full
        border
        border-[#D9DEFF]
        bg-gradient-to-b
        from-white
        via-[#FAFBFF]
        to-[#F2F5FD]
      "
    >

      {enabled && (

        <>
          <div className="absolute h-16 w-16 animate-ping rounded-full border border-[#5D5FEF]/25" />

          <div
            className="absolute h-24 w-24 rounded-full border border-[#5D5FEF]/12"
            style={{
              animation:
                "ping 2.5s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
        </>

      )}

      <div className="absolute h-[80px] w-[80px] rounded-full border border-[#E6EBFF]" />

      <div className="absolute h-[130px] w-[130px] rounded-full border border-[#E6EBFF]" />

      <div className="absolute h-[180px] w-[180px] rounded-full border border-[#E6EBFF]" />

      <div className="absolute h-[240px] w-[240px] rounded-full border border-[#E6EBFF]" />

      <div className="absolute h-[300px] w-[300px] rounded-full border border-[#DCE4FF]" />

      <div className="absolute h-[220px] w-px bg-[#EDF1FF]" />

      <div className="absolute h-px w-[220px] bg-[#EDF1FF]" />

      {enabled &&

        profiles.map(
          (profile, index) => {

            const position =
              getPosition(
                profile,
                index,
              );

            const intensity =
              1 -
              profile.distance /
                MAX_RADIUS;

            const size =
              10 +
              intensity * 10;

            return (

              <div
                key={profile.id}
                className="absolute transition-all duration-700"
                style={{
                  left: position.left,
                  top: position.top,
                }}
              >

                <span
                  className="absolute animate-ping rounded-full bg-[#FF4D5A]/20"
                  style={{
                    width: size + 16,
                    height: size + 16,
                    left: -(size + 16) / 2,
                    top: -(size + 16) / 2,
                  }}
                />

                <span
                  className="relative block rounded-full bg-[#FF4D5A]"
                  style={{
                    width: size,
                    height: size,
                    boxShadow:
                      `0 0 ${
                        14 +
                        intensity * 18
                      }px rgba(255,77,90,.55)`,
                  }}
                />

              </div>

            );

          },
        )}

      <div className="absolute h-14 w-14 rounded-full bg-[#5D5FEF]/8 blur-xl" />

      <div
        className="
          relative
          z-20
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-[#5D5FEF]
          shadow-[0_0_35px_rgba(93,95,239,.45)]
        "
      >

        <span className="h-4 w-4 rounded-full bg-white" />

      </div>

    </section>

  );

}