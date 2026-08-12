type DashboardHeaderProps = {
  section: "radar" | "events" | "settings";
};

export function DashboardHeader({ section }: DashboardHeaderProps) {
  const title =
    section === "radar"
      ? "LookUp"
      : section === "events"
        ? "Actividades"
        : "Ajustes";

  const isRadar = section === "radar";
  const isSettings = section === "settings";

  return (
    <header className="flex items-center justify-between px-1">
      <h1
        className={[
          "font-black tracking-[-0.05em]",
          isRadar
            ? "text-[2.3rem] italic text-[#5D5FEF]"
            : isSettings
              ? "text-[2rem] text-[#5D5FEF]"
              : "text-[2rem] text-slate-900",
        ].join(" ")}
      >
        {title}
      </h1>
    </header>
  );
}
