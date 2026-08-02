"use client";

import type {
  NearbyProfile,
} from "@lookup/types";

import { NearbyProfileCard } from "./NearbyProfileCard";

type Props = {
  enabled: boolean;
  profiles: NearbyProfile[];
};

export function NearbyProfiles({
  enabled,
  profiles,
}: Props) {

  if (!enabled) {

    return (

      <section className="rounded-[2rem] border border-[#ECEFF5] bg-white p-8 text-center shadow-sm">

        <h2 className="text-xl font-black text-slate-900">
          Radar desactivado
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Activa el radar para comenzar a detectar personas.
        </p>

      </section>

    );

  }

  return (

    <section className="-mt-1 space-y-4">

      <div className="flex items-end justify-between px-1">

        <div>

          <p className="text-[11px] font-black uppercase tracking-[0.30em] text-slate-400">
            PERSONAS CERCA
          </p>

        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">

          Actualizado ahora

        </span>

      </div>

      {profiles.length === 0 && (

        <div
          className="
            rounded-[28px]
            border
            border-dashed
            border-[#E8ECF4]
            bg-white
            px-8
            py-8
            text-center
            shadow-sm
          "
        >

          <p className="text-base font-black text-slate-700">
            No hay personas cerca
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Mantén el radar activo.
            <br />
            Los nuevos usuarios aparecerán automáticamente.
          </p>

        </div>

      )}

      <div className="space-y-4">

        {profiles.map((profile) => (

          <NearbyProfileCard
            key={profile.id}
            profile={profile}
          />

        ))}

      </div>

    </section>

  );

}