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
    <section className="mt-5 space-y-5">

      <div className="flex items-center justify-between">

        <span
          className={[
            "text-[11px] font-black uppercase tracking-[0.32em]",
            enabled
              ? "text-[#16A34A]"
              : "text-[#EF4444]",
          ].join(" ")}
        >
          {enabled ? "ACTIVO" : "INACTIVO"}
        </span>

        <button
          type="button"
          onClick={onToggle}
          aria-label="Activar radar"
          className={[
            "relative h-8 w-14 rounded-full transition-all duration-300",
            enabled
              ? "bg-[#22C55E]"
              : "bg-[#D7DCE8]",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300",
              enabled
                ? "left-7"
                : "left-1",
            ].join(" ")}
          />
        </button>

      </div>

      <div className="flex items-center justify-between border-t border-[#ECEFF5] pt-4">

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
            px-3.5
            py-2
            text-[11px]
            font-black
            uppercase
            tracking-[0.08em]
            text-[#5D5FEF]
            transition-all
            hover:bg-[#E3E8FF]
          "
        >
          <RefreshCw size={13} />

          ESCANEAR
        </button>

      </div>

    </section>
  );
}