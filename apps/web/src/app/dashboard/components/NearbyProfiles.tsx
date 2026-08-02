"use client";

import { NearbyProfileCard } from "./NearbyProfileCard";

import type {
  ProfileRow,
} from "@lookup/services";

type Props = {
  enabled: boolean;
  profiles: ProfileRow[];
};

export function NearbyProfiles({
  enabled,
  profiles,
}: Props) {

  if (!enabled) {

    return (

      <section className="rounded-[2rem] bg-white p-12 text-center shadow-sm">

        <h2 className="text-2xl font-black text-slate-900">
          Radar desactivado
        </h2>

        <p className="mt-3 text-slate-500">
          Activa el radar para descubrir personas cerca de ti.
        </p>

      </section>

    );

  }

  return (

    <section className="space-y-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5D5FEF]">
            PERSONAS CERCA
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            Cerca de ti
          </h2>

        </div>

        <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-bold text-[#5D5FEF]">

          {profiles.length}

        </span>

      </div>

      {profiles.length === 0 && (

        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center">

          <p className="text-lg font-bold text-slate-700">
            No hay personas cerca
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Sigue con el radar activo para detectar nuevos usuarios.
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