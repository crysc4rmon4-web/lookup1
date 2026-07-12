"use client";

import Link from "next/link";

type RadarCardProps = {
  id: string;
  name: string;
  profession: string;
  city: string;
  bio: string;
  onSkip?: () => void;
  onConnect?: () => void;
  active?: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function RadarCard({
  id,
  name,
  profession,
  city,
  bio,
  onSkip,
  onConnect,
  active = false,
}: RadarCardProps) {
  return (
    <article
      className={`rounded-[2rem] bg-white p-5 shadow-sm transition ${active ? "ring-2 ring-[#5D5FEF]/20" : ""
        }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#5D5FEF] bg-slate-50 text-lg font-black text-slate-900">
          {getInitials(name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-slate-900">
            {name}
          </h3>

          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5D5FEF]">
            {profession}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            📍 {city}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-4 text-sm leading-6 text-slate-600">
        {bio}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2">

        <button
          type="button"
          onClick={onSkip}
          disabled={!onSkip}
          className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Saltar
        </button>

        <Link
          href={`/profile/${id}`}
          className="flex items-center justify-center rounded-xl border border-[#5D5FEF] py-3 text-sm font-bold text-[#5D5FEF] transition hover:bg-[#5D5FEF] hover:text-white"
        >
          Perfil
        </Link>

        <button
          type="button"
          onClick={onConnect}
          disabled={!onConnect}
          className="rounded-xl bg-[#5D5FEF] py-3 text-sm font-bold text-white transition hover:bg-[#4d4fdc] disabled:opacity-50"
        >
          Conectar
        </button>

      </div>
    </article>
  );
}