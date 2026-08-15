"use client";

import type { NearbyProfile } from "@lookup/types";

import { NearbyProfileCard } from "./NearbyProfileCard";

type Props = {
  enabled: boolean;
  ready: boolean;
  locationLoading: boolean;
  locationError: string | null;
  profiles: NearbyProfile[];
};

export function NearbyProfiles({
  enabled,
  ready,
  locationLoading,
  locationError,
  profiles,
}: Props) {
  if (!enabled) {
    return (
      <section className="rounded-[2rem] border border-[#ECEFF5] bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-slate-900">
          Radar desactivado
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Activa el Radar para descubrir qué hay cerca de ti.
        </p>
      </section>
    );
  }

  if (locationError) {
    return (
      <section className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-black text-slate-900">
          No pudimos usar tu ubicación
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {locationError}
        </p>

        <p className="mt-3 text-xs leading-5 text-slate-400">
          Revisa los permisos de ubicación del navegador y vuelve a activar el
          Radar.
        </p>
      </section>
    );
  }

  if (locationLoading || !ready) {
    return (
      <section className="rounded-[2rem] border border-[#E7E9F2] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-2 w-2 animate-pulse rounded-full bg-[#5D5FEF]" />

        <h2 className="mt-4 text-lg font-black text-slate-900">
          Preparando Radar
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Estamos obteniendo y sincronizando tu ubicación.
        </p>
      </section>
    );
  }

  return (
    <section className="-mt-1 space-y-4">
      <div className="flex items-end justify-between px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.30em] text-slate-400">
          CERCA DE TI
        </p>

        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">
          25 METROS
        </span>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#E8ECF4] bg-white px-8 py-8 text-center shadow-sm">
          <p className="text-base font-black text-slate-700">
            Nada visible cerca por ahora
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Mantén el Radar activo.
            <br />
            Personas y negocios aparecerán automáticamente.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {profiles.map((profile) => (
          <NearbyProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </section>
  );
}