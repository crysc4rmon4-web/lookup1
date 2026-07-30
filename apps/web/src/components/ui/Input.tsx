"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className = "",
  ...props
}: Props) {
  return (
    <input
      className={[
        "h-14 w-full rounded-[20px] border border-[#E8EBF5] bg-white px-5 text-[16px] text-[#101828] outline-none transition-all",
        "placeholder:text-[#98A2B3]",
        "focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}