"use client";

import { useMemo } from "react";

type StepUsernameProps = {
  username: string;
  onChange: (value: string) => void;
};

export function StepUsername({
  username,
  onChange,
}: StepUsernameProps) {
  const normalized = useMemo(
    () =>
      username
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._]/g, ""),
    [username],
  );

  return (
    <section className="flex flex-col">

      <h2 className="text-3xl font-black text-slate-900">
        Elige tu username
      </h2>

      <p className="mt-2 text-slate-500">
        Será tu identidad dentro de LookUp.
      </p>

      <input
        value={username}
        onChange={(e) => onChange(e.target.value)}
        placeholder="crysc4rmon4"
        className="mt-10 rounded-2xl border border-slate-200 p-5 text-lg outline-none focus:border-[#5D5FEF]"
      />

      <div className="mt-5 rounded-xl bg-slate-50 p-4">

        <p className="text-xs uppercase tracking-widest text-slate-400">
          Vista previa
        </p>

        <p className="mt-2 text-xl font-black text-[#5D5FEF]">
          @{normalized || "username"}
        </p>

      </div>

    </section>
  );
}