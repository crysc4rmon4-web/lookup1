"use client";

import { RefreshCw, Smartphone } from "lucide-react";

type Props = {
  enabled: boolean;
  radius: number;
  nearbyCount: number;
  bluetoothEnabled?: boolean;

  onToggle(): void;
  onRefresh(): void;
};

export function RadarTopBar({
  enabled,
  radius,
  nearbyCount,
  bluetoothEnabled = true,
  onToggle,
  onRefresh,
}: Props) {
  return (
    <section className="space-y-5">

      <div className="flex items-center justify-between">

        <div>

          <p
            className={[
              "text-xs font-black uppercase tracking-[0.25em]",
              enabled
                ? "text-[#00B84F]"
                : "text-[#EF4444]",
            ].join(" ")}
          >
            {enabled
              ? "ACTIVO"
              : "INACTIVO"}
          </p>

        </div>

        <button
          type="button"
          onClick={onToggle}
          className={[
            "relative h-8 w-14 rounded-full transition-colors",
            enabled
              ? "bg-[#22C55E]"
              : "bg-[#E5E7EB]",
          ].join(" ")}
        >

          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all",
              enabled
                ? "left-7"
                : "left-1",
            ].join(" ")}
          />

        </button>

      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[#ECEFF5] bg-white px-4 py-3">

        <div className="flex items-center gap-5 text-sm font-semibold text-slate-600">

          <span>
            🎯 {radius} m
          </span>

          <span>
            👥 {nearbyCount} cerca
          </span>

          <span className="flex items-center gap-1">

            <Smartphone
              size={14}
            />

            {bluetoothEnabled
              ? "BLE"
              : "--"}

          </span>

        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-full bg-[#EEF2FF] px-4 py-2 text-xs font-bold text-[#5D5FEF] transition hover:bg-[#E0E7FF]"
        >

          <RefreshCw
            size={14}
          />

          ESCANEAR

        </button>

      </div>

    </section>
  );
}