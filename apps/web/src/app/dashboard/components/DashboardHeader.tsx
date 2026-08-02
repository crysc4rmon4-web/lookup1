type DashboardHeaderProps = {
  section: "radar" | "events" | "settings";
};

export function DashboardHeader({
  section,
}: DashboardHeaderProps) {
  const title =
    section === "radar"
      ? "LookUp"
      : section === "events"
      ? "Actividades"
      : "Configuración";

  return (
    <header>

      <h1
        className={[
          "font-black italic tracking-[-0.05em]",
          section === "radar"
            ? "text-[2.3rem] text-[#5D5FEF]"
            : "text-[2rem] text-slate-900",
        ].join(" ")}
      >
        {title}
      </h1>

    </header>
  );
}