"use client";

import { useMemo } from "react";

import type { NearbyProfile } from "@lookup/types";

type Props = {
  enabled: boolean;
  profiles: NearbyProfile[];
};

const MAX_RADIUS_METERS = 25;

type RadarProfilePosition = {
  id: string;
  left: string;
  top: string;
  size: number;
  intensity: number;
};

function getStableAngle(id: string): number {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash =
      (hash << 5) -
      hash +
      id.charCodeAt(index);

    hash |= 0;
  }

  return Math.abs(hash) % 360;
}

export function RadarCanvas({
  enabled,
  profiles,
}: Props) {
  const profilePositions =
    useMemo<RadarProfilePosition[]>(() => {
      if (!enabled || profiles.length === 0) {
        return [];
      }

      return profiles.map((profile) => {
        const distance = Math.min(
          Math.max(profile.distance, 0),
          MAX_RADIUS_METERS,
        );

        const normalizedDistance =
          distance /
          MAX_RADIUS_METERS;

        /*
         * Dejamos margen interno para que los puntos
         * nunca puedan tocar el borde del radar.
         */
        const radialPercent =
          8 +
          normalizedDistance * 34;

        const angle =
          getStableAngle(profile.id);

        const radians =
          (angle * Math.PI) / 180;

        const left =
          50 +
          Math.cos(radians) *
            radialPercent;

        const top =
          50 +
          Math.sin(radians) *
            radialPercent;

        const intensity =
          Math.max(
            0,
            1 - normalizedDistance,
          );

        const size =
          8 +
          intensity * 5;

        return {
          id: profile.id,
          left: `${left}%`,
          top: `${top}%`,
          size,
          intensity,
        };
      });
    }, [enabled, profiles]);

  return (
    <section
      aria-label="Radar de personas cercanas"
      className="
        relative
        mx-auto
        aspect-square
        w-full
        max-w-[360px]
        overflow-hidden
        rounded-full
        border
        border-[#DCE2F8]
        bg-[radial-gradient(circle_at_center,#E9ECFF_0%,#F2F4FC_38%,#F8F9FD_72%,#FFFFFF_100%)]
        shadow-[0_18px_45px_rgba(45,52,110,0.12)]
      "
    >
      <style>
        {`
          @keyframes lookup-radar-sweep {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes lookup-radar-pulse {
            0%,
            100% {
              transform: scale(0.92);
              opacity: 0.22;
            }

            50% {
              transform: scale(1.08);
              opacity: 0.48;
            }
          }

          @keyframes lookup-radar-dot {
            0%,
            100% {
              transform: scale(0.82);
              opacity: 0.55;
            }

            50% {
              transform: scale(1.16);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Radar glow */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-[8%]
          rounded-full
          bg-[radial-gradient(circle_at_center,rgba(93,95,239,0.14),transparent_68%)]
        "
      />

      {/* Radar rings */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-[8%]
          rounded-full
          border
          border-[#D9DEEF]
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute
          inset-[21%]
          rounded-full
          border
          border-[#DCE1F2]
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute
          inset-[34%]
          rounded-full
          border
          border-[#DEE3F3]
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute
          inset-[47%]
          rounded-full
          border
          border-[#E1E5F3]
        "
      />

      {/* Crosshair */}
      <div
        aria-hidden="true"
        className="
          absolute
          left-[8%]
          right-[8%]
          top-1/2
          h-px
          -translate-y-1/2
          bg-[#DDE2F2]
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute
          bottom-[8%]
          top-[8%]
          left-1/2
          w-px
          -translate-x-1/2
          bg-[#DDE2F2]
        "
      />

      {/* Scanning sweep */}
      {enabled && (
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-[4%]
            rounded-full
          "
          style={{
            animation:
              "lookup-radar-sweep 3s linear infinite",
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 315deg, rgba(93,95,239,0.02) 330deg, rgba(93,95,239,0.16) 348deg, rgba(93,95,239,0.32) 358deg, transparent 360deg)",
          }}
        />
      )}

      {/* Outer scan pulse */}
      {enabled && (
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-[22%]
            w-[22%]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-[#5D5FEF]/25
          "
          style={{
            animation:
              "lookup-radar-pulse 2.4s ease-in-out infinite",
          }}
        />
      )}

      {/* Nearby people */}
      {profilePositions.map(
        (position) => (
          <div
            key={position.id}
            className="
              absolute
              z-10
              transition-[left,top]
              duration-700
              ease-out
            "
            style={{
              left: position.left,
              top: position.top,
              transform:
                "translate(-50%, -50%)",
            }}
          >
            {/* Outer glow */}
            <span
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                rounded-full
                border
                border-[#FF4D5A]/30
              "
              style={{
                width:
                  position.size + 22,
                height:
                  position.size + 22,
                transform:
                  "translate(-50%, -50%)",
                animation:
                  "lookup-radar-dot 1.8s ease-in-out infinite",
                opacity:
                  0.25 +
                  position.intensity * 0.5,
              }}
            />

            {/* Scan point */}
            <span
              className="
                relative
                block
                rounded-full
                border
                border-white
                bg-[#FF4D5A]
              "
              style={{
                width: position.size,
                height: position.size,
                boxShadow: `
                  0 0 ${
                    8 +
                    position.intensity * 12
                  }px rgba(255,77,90,0.48),
                  0 0 ${
                    18 +
                    position.intensity * 18
                  }px rgba(255,77,90,0.18)
                `,
              }}
            />
          </div>
        ),
      )}

      {/* Current user */}
      <div
        aria-label="Tu ubicación"
        className="
          absolute
          left-1/2
          top-1/2
          z-20
          flex
          h-[18%]
          w-[18%]
          min-h-10
          min-w-10
          -translate-x-1/2
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          border
          border-white/80
          bg-[#5D5FEF]
          shadow-[0_0_28px_rgba(93,95,239,0.42)]
        "
      >
        <span
          className="
            h-[32%]
            w-[32%]
            rounded-full
            bg-white
            shadow-[0_0_10px_rgba(255,255,255,0.85)]
          "
        />
      </div>
    </section>
  );
}