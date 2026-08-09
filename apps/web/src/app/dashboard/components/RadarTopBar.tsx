"use client";

import {
  Crosshair,
  MapPinned,
  RefreshCw,
  Users,
} from "lucide-react";

type Props = {
  enabled: boolean;
  toggleLoading: boolean;
  radius: number;
  nearbyCount: number;
  onToggle(): void;
  onRefresh(): void;
};

export function RadarTopBar({
  enabled,
  toggleLoading,
  radius,
  nearbyCount,
  onToggle,
  onRefresh,
}: Props) {
  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span
          className={[
            "text-[11px] font-black uppercase tracking-[0.32em]",
            enabled
              ? "text-[#16A34A]"
              : "text-[#EF4444]",
          ].join(" ")}
        >
          {toggleLoading
            ? "ACTUALIZANDO"
            : enabled
              ? "ACTIVO"
              : "INACTIVO"}
        </span>

        <button
          type="button"
          onClick={onToggle}
          disabled={toggleLoading}
          aria-label={
            enabled
              ? "Desactivar radar"
              : "Activar radar"
          }
          aria-pressed={enabled}
          className={[
            "relative h-8 w-14 shrink-0 rounded-full transition-all duration-300",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/40",
            toggleLoading
              ? "cursor-wait opacity-60"
              : "cursor-pointer",
            enabled
              ? "bg-[#22C55E]"
              : "bg-[#D7DCE8]",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow-md",
              "transition-all duration-300",
              enabled
                ? "left-7"
                : "left-1",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#ECEFF5] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-5">
          <div className="flex items-center gap-2">
            <Crosshair
              size={14}
              aria-hidden="true"
              className="shrink-0 text-[#5D5FEF]"
            />

            <span className="text-xs font-bold text-slate-700">
              {radius} m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users
              size={14}
              aria-hidden="true"
              className="shrink-0 text-[#5D5FEF]"
            />

            <span className="text-xs font-bold text-slate-700">
              {nearbyCount} cerca
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPinned
              size={14}
              aria-hidden="true"
              className={[
                "shrink-0",
                enabled
                  ? "text-[#22C55E]"
                  : "text-slate-300",
              ].join(" ")}
            />

            <span className="text-xs font-bold text-slate-700">
              GPS
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={
            toggleLoading ||
            !enabled
          }
          aria-label="Escanear personas cercanas"
          className={[
            "flex w-full shrink-0 items-center justify-center gap-2",
            "rounded-full px-3.5 py-2",
            "text-[11px] font-black uppercase tracking-[0.08em]",
            "transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/40",
            "sm:w-auto",
            toggleLoading ||
            !enabled
              ? "cursor-not-allowed bg-[#F1F3F8] text-slate-300"
              : "cursor-pointer bg-[#EEF2FF] text-[#5D5FEF] hover:bg-[#E3E8FF]",
          ].join(" ")}
        >
          <RefreshCw
            size={13}
            aria-hidden="true"
            className={
              toggleLoading
                ? "animate-spin"
                : ""
            }
          />

          {toggleLoading
            ? "ACTUALIZANDO"
            : "ESCANEAR"}
        </button>
      </div>
    </section>
  );
}