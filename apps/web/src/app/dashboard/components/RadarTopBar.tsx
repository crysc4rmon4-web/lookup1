"use client";

import { Crosshair, MapPinned, RefreshCw, Users } from "lucide-react";

type Props = {
  enabled: boolean;
  radarReady: boolean;

  toggleLoading: boolean;
  locationLoading: boolean;
  locationSyncing: boolean;

  locationError: string | null;
  accuracy: number | null;

  radius: number;
  nearbyCount: number;

  onToggle(): void;
  onRefresh(): void;
};

function getRadarStatus({
  enabled,
  radarReady,
  toggleLoading,
  locationLoading,
  locationSyncing,
  locationError,
}: Pick<
  Props,
  | "enabled"
  | "radarReady"
  | "toggleLoading"
  | "locationLoading"
  | "locationSyncing"
  | "locationError"
>) {
  if (toggleLoading) {
    return {
      label: "ACTUALIZANDO",
      className: "text-slate-400",
    };
  }

  if (!enabled) {
    return {
      label: "INACTIVO",
      className: "text-[#EF4444]",
    };
  }

  if (locationError) {
    return {
      label: "NO DISPONIBLE",
      className: "text-[#EF4444]",
    };
  }

  if (locationLoading) {
    return {
      label: "LOCALIZANDO",
      className: "text-amber-500",
    };
  }

  if (locationSyncing || !radarReady) {
    return {
      label: "SINCRONIZANDO",
      className: "text-amber-500",
    };
  }

  return {
    label: "ACTIVO",
    className: "text-[#16A34A]",
  };
}

function getGpsStatus({
  enabled,
  accuracy,
  locationLoading,
  locationError,
}: Pick<Props, "enabled" | "accuracy" | "locationLoading" | "locationError">) {
  if (!enabled) {
    return {
      label: "GPS",
      className: "text-slate-300",
    };
  }

  if (locationError) {
    return {
      label: "GPS · error",
      className: "text-[#EF4444]",
    };
  }

  if (locationLoading || accuracy === null) {
    return {
      label: "GPS · buscando",
      className: "text-amber-500",
    };
  }

  const roundedAccuracy = Math.max(1, Math.round(accuracy));

  if (accuracy <= 15) {
    return {
      label: `GPS preciso · ±${roundedAccuracy} m`,
      className: "text-[#16A34A]",
    };
  }

  if (accuracy <= 35) {
    return {
      label: `GPS aceptable · ±${roundedAccuracy} m`,
      className: "text-amber-500",
    };
  }

  return {
    label: `GPS débil · ±${roundedAccuracy} m`,
    className: "text-orange-500",
  };
}

export function RadarTopBar({
  enabled,
  radarReady,
  toggleLoading,
  locationLoading,
  locationSyncing,
  locationError,
  accuracy,
  radius,
  nearbyCount,
  onToggle,
  onRefresh,
}: Props) {
  const radarStatus = getRadarStatus({
    enabled,
    radarReady,
    toggleLoading,
    locationLoading,
    locationSyncing,
    locationError,
  });

  const gpsStatus = getGpsStatus({
    enabled,
    accuracy,
    locationLoading,
    locationError,
  });

  const scanDisabled = toggleLoading || !enabled || !radarReady;

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span
          aria-live="polite"
          className={[
            "text-[11px] font-black uppercase tracking-[0.32em]",
            radarStatus.className,
          ].join(" ")}
        >
          {radarStatus.label}
        </span>

        <button
          type="button"
          onClick={onToggle}
          disabled={toggleLoading}
          aria-label={enabled ? "Desactivar radar" : "Activar radar"}
          aria-pressed={enabled}
          className={[
            "relative h-8 w-14 shrink-0 rounded-full transition-all duration-300",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/40",
            toggleLoading ? "cursor-wait opacity-60" : "cursor-pointer",
            enabled ? "bg-[#22C55E]" : "bg-[#D7DCE8]",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow-md",
              "transition-all duration-300",
              enabled ? "left-7" : "left-1",
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
              {radarReady ? `${nearbyCount} cerca` : "— cerca"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPinned
              size={14}
              aria-hidden="true"
              className={["shrink-0", gpsStatus.className].join(" ")}
            />

            <span
              className={[
                "text-xs font-bold",
                gpsStatus.className,
              ].join(" ")}
            >
              {gpsStatus.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={scanDisabled}
          aria-label="Escanear conexiones cercanas"
          className={[
            "flex w-full shrink-0 items-center justify-center gap-2",
            "rounded-full px-3.5 py-2",
            "text-[11px] font-black uppercase tracking-[0.08em]",
            "transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/40",
            "sm:w-auto",
            scanDisabled
              ? "cursor-not-allowed bg-[#F1F3F8] text-slate-300"
              : "cursor-pointer bg-[#EEF2FF] text-[#5D5FEF] hover:bg-[#E3E8FF]",
          ].join(" ")}
        >
          <RefreshCw size={13} aria-hidden="true" />

          ESCANEAR
        </button>
      </div>
    </section>
  );
}