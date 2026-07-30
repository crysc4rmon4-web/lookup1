"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

export function SelectableCard({
  title,
  icon,
  selected = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-4 rounded-[22px] border p-5 transition-all",
        selected
          ? "border-[#5D5FEF] bg-[#EEF2FF]"
          : "border-[#E8EBF5] bg-white hover:border-[#5D5FEF]/40",
      ].join(" ")}
    >
      <div className="text-2xl">
        {icon}
      </div>

      <span className="font-semibold text-[#101828]">
        {title}
      </span>
    </button>
  );
}