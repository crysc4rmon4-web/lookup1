"use client";

import { SocialIcon } from "./SocialIcon";

type PlatformCardProps = {
  platform: string;
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function PlatformCard({
  platform,
  label,
  selected,
  onClick,
}: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex aspect-square w-full flex-col items-center justify-center",
        "rounded-[28px] border-2 transition-all duration-200",
        selected
          ? "border-[#5D5FEF] bg-[#EEF0FF] shadow-md"
          : "border-[#E5E7EB] bg-white hover:border-[#5D5FEF] hover:shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
          selected ? "bg-[#5D5FEF] text-white" : "bg-slate-100 text-slate-700",
        ].join(" ")}
      >
        <SocialIcon platform={platform} size={26} />
      </div>

      <span
        className={[
          "mt-4 text-xs font-bold",
          selected ? "text-[#5D5FEF]" : "text-slate-700",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}
