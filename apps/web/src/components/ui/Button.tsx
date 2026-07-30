"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost";

type Props =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    fullWidth?: boolean;
    loading?: boolean;
  };

export function Button({
  children,
  variant = "primary",
  fullWidth = true,
  loading = false,
  disabled,
  className = "",
  ...props
}: Props) {
  const base =
    "flex h-14 items-center justify-center rounded-[24px] text-base font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-[#111827] text-white hover:bg-[#1F2937]",

    secondary:
      "border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]",

    ghost:
      "bg-transparent text-[#667085] hover:bg-[#F3F4F6]",
  };

  return (
    <button
      disabled={disabled || loading}
      className={[
        base,
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}