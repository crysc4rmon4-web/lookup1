"use client";

type RadarCardProps = {
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
      className={`rounded-[2rem] bg-white p-5 shadow-sm ${
        active ? "ring-1 ring-[#5D5FEF]/20" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#5D5FEF] bg-slate-50 text-sm font-black text-slate-900">
          {getInitials(name)}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-slate-900">
            {name}
          </h3>

          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#5D5FEF]">
            {profession}
          </p>

          <p className="mt-1 text-xs text-slate-500">📍 {city}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{bio}</p>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!onSkip}
        >
          Saltar
        </button>

        <button
          type="button"
          onClick={onConnect}
          className="flex-1 rounded-xl bg-[#5D5FEF] py-3 text-sm font-bold text-white transition hover:bg-[#5153e6] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!onConnect}
        >
          Conectar
        </button>
      </div>
    </article>
  );
}