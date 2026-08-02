type DashboardHeaderProps = {
  section: "radar" | "events" | "settings";
  profileVisible: boolean;
  onToggleVisibility: () => void;
};

export function DashboardHeader({
  section,
  profileVisible,
  onToggleVisibility,
}: DashboardHeaderProps) {
  return (
    <header className="rounded-[2rem] bg-white px-6 py-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[0.72rem] font-black uppercase tracking-[0.35em] text-slate-400">
            LookUp
          </p>

          <h1 className="mt-1 text-[2.15rem] font-black italic tracking-[-0.04em] text-[#5D5FEF]">
            {section === "radar"
              ? "Radar"
              : section === "events"
                ? "Actividades"
                : "Configuración"}
          </h1>

        </div>

      </div>

    </header>
  );
}