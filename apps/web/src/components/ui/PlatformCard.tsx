"use client";

import type { ReactNode } from "react";

type PlatformCardProps = {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
};

export function PlatformCard({
  label,
  icon,
  selected,
  onClick,
}: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex flex-col items-center justify-center",
        "aspect-square w-[94px]",
        "rounded-3xl border-2",
        "transition-all duration-200",
        selected
          ? "border-[#5D5FEF] bg-[#EEF0FF] shadow-md"
          : "border-[#E5E7EB] bg-white hover:border-[#5D5FEF] hover:shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
          selected
            ? "bg-[#5D5FEF] text-white"
            : "bg-slate-100 text-slate-700 group-hover:bg-[#EEF0FF]",
        ].join(" ")}
      >
        {icon}
      </div>

      <span
        className={[
          "mt-3 text-xs font-semibold",
          selected
            ? "text-[#5D5FEF]"
            : "text-slate-700",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}