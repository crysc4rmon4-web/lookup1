"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({
  children,
  className = "",
}: Props) {
  return (
    <section
      className={[
        "rounded-[32px] border border-[#ECEEF5] bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.05)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}