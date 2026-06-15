"use client";

type Section = "radar" | "events" | "settings";

type BottomNavProps = {
  active: Section;
  onChange: (section: Section) => void;
};

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center justify-around px-4 py-3">
        <button
          type="button"
          onClick={() => onChange("radar")}
          aria-pressed={active === "radar"}
          className={`flex flex-col items-center gap-1 text-xs font-black uppercase tracking-wide transition ${
            active === "radar" ? "text-[#5D5FEF]" : "text-slate-400"
          }`}
        >
          <span className="text-base">⌖</span>
          Radar
        </button>

        <button
          type="button"
          onClick={() => onChange("events")}
          aria-pressed={active === "events"}
          className={`flex flex-col items-center gap-1 text-xs font-black uppercase tracking-wide transition ${
            active === "events" ? "text-[#5D5FEF]" : "text-slate-400"
          }`}
        >
          <span className="text-base">✦</span>
          Eventos
        </button>

        <button
          type="button"
          onClick={() => onChange("settings")}
          aria-pressed={active === "settings"}
          className={`flex flex-col items-center gap-1 text-xs font-black uppercase tracking-wide transition ${
            active === "settings" ? "text-[#5D5FEF]" : "text-slate-400"
          }`}
        >
          <span className="text-base">⚙</span>
          Ajustes
        </button>
      </div>
    </nav>
  );
}