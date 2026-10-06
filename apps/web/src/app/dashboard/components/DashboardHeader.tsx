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

  return (
    <header className="flex items-center justify-between px-1">
      <h1
        className={[
          "font-black tracking-[-0.05em]",
          isRadar
            ? "text-[2.3rem] italic text-[#5D5FEF]"
            : "text-[2rem] text-[#5D5FEF]",
        ].join(" ")}
      >
        {title}
      </h1>
    </header>
  );
}
