"use client";

import {
  Crosshair,
  RefreshCw,
  Users,
  Smartphone,
} from "lucide-react";

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
              "text-xs font-black uppercase tracking-[0.28em]",
              enabled
                ? "text-[#16A34A]"
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
            "relative h-8 w-14 rounded-full transition-all duration-300",
            enabled
              ? "bg-[#22C55E]"
              : "bg-[#E5E7EB]",
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

      <div className="flex items-center justify-between rounded-2xl border border-[#ECEFF5] bg-white px-4 py-3 shadow-sm">

        <div className="flex items-center gap-5">

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">

            <Crosshair
              size={15}
              className="text-[#5D5FEF]"
            />

            <span>

              {radius} m

            </span>

          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">

            <Users
              size={15}
              className="text-[#5D5FEF]"
            />

            <span>

              {nearbyCount}

            </span>

          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">

            <Smartphone
              size={15}
              className={
                bluetoothEnabled
                  ? "text-[#5D5FEF]"
                  : "text-slate-300"
              }
            />

            <span>

              {bluetoothEnabled
                ? "BLE"
                : "--"}

            </span>

          </div>

        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-full bg-[#EEF2FF] px-4 py-2 text-xs font-bold tracking-wide text-[#5D5FEF] transition hover:bg-[#E2E8FF]"
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