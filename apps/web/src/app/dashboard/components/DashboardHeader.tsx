type DashboardHeaderProps = {
  title: string;
  profileVisible: boolean;
  onToggleVisibility: () => void;
};

export function DashboardHeader({
  title,
  profileVisible,
  onToggleVisibility,
}: DashboardHeaderProps) {
  return (
    <header className="rounded-[2rem] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-400">
            LookUp
          </p>

          <h1 className="mt-1 text-[2rem] font-black italic tracking-[-0.04em] text-[#5D5FEF]">
            {title}
          </h1>
        </div>

        <button
          type="button"
          onClick={onToggleVisibility}
          className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-600"
        >
          <span>{profileVisible ? "VISIBLE" : "OCULTO"}</span>

          <span
            className={`h-5 w-9 rounded-full p-1 transition ${
              profileVisible
                ? "bg-emerald-500"
                : "bg-slate-300"
            }`}
          >
            <span
              className={`block h-3 w-3 rounded-full bg-white transition ${
                profileVisible
                  ? "translate-x-4"
                  : "translate-x-0"
              }`}
            />
          </span>
        </button>
      </div>
    </header>
  );
}