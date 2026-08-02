"use client";

import {
  Crosshair,
  MapPinned,
  RefreshCw,
  Users,
} from "lucide-react";

type Props = {
  enabled: boolean;
  radius: number;
  nearbyCount: number;

  onToggle(): void;
  onRefresh(): void;
};

export function RadarTopBar({
  enabled,
  radius,
  nearbyCount,
  onToggle,
  onRefresh,
}: Props) {
  return (
    <section className="space-y-3">

      <div className="flex items-center justify-between">

        <div className="flex flex-col">

          <span
            className={[
              "text-[11px] font-black uppercase tracking-[0.35em]",
              enabled
                ? "text-[#16A34A]"
                : "text-[#EF4444]",
            ].join(" ")}
          >
            {enabled
              ? "ACTIVO"
              : "INACTIVO"}
          </span>

        </div>

        <button
          type="button"
          onClick={onToggle}
          className={[
            "relative h-8 w-14 rounded-full transition-all duration-300",
            enabled
              ? "bg-[#22C55E]"
              : "bg-[#E5E7EB]",
          ].join(" ")}
        >

          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-300",
              enabled
                ? "left-7"
                : "left-1",
            ].join(" ")}
          />

        </button>

      </div>

      <div
        className="
          flex
          items-center
          justify-between
          rounded-[22px]
          border
          border-[#ECEFF5]
          bg-white
          px-4
          py-3
          shadow-sm
        "
      >

        <div className="flex items-center gap-5">

          <div className="flex items-center gap-2">

            <Crosshair
              size={14}
              className="text-[#5D5FEF]"
            />

            <span className="text-xs font-bold text-slate-700">
              {radius} m
            </span>

          </div>

          <div className="flex items-center gap-2">

            <Users
              size={14}
              className="text-[#5D5FEF]"
            />

            <span className="text-xs font-bold text-slate-700">
              {nearbyCount} cerca
            </span>

          </div>

          <div className="flex items-center gap-2">

            <MapPinned
              size={14}
              className={
                enabled
                  ? "text-[#22C55E]"
                  : "text-slate-300"
              }
            />

            <span className="text-xs font-bold text-slate-700">
              GPS
            </span>

          </div>

        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="
            flex
            items-center
            gap-2
            rounded-full
            bg-[#EEF2FF]
            px-3
            py-2
            text-[11px]
            font-black
            uppercase
            tracking-[0.08em]
            text-[#5D5FEF]
            transition
            hover:bg-[#E4E9FF]
          "
        >

          <RefreshCw size={13} />

          Escanear

        </button>

      </div>

    </section>
  );
}