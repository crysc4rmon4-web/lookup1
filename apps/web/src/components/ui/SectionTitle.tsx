"use client";

type Props = {
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionTitle({ title, description, align = "left" }: Props) {
  return (
    <header className={align === "center" ? "text-center" : ""}>
      <h2 className="text-[32px] font-black tracking-tight text-[#101828]">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-base leading-7 text-[#667085]">{description}</p>
      )}
    </header>
  );
}
