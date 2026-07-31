"use client";

type StepUsernameProps = {
  username: string;
  onChange: (value: string) => void;
};

export function StepUsername({
  username,
  onChange,
}: StepUsernameProps) {
  function normalize(value: string) {
    return value
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._]/g, "");
  }

  return (
    <section className="flex min-h-[560px] flex-col">

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5D5FEF]">
          PERFIL
        </p>

        <h2 className="mt-4 text-4xl font-black text-[#111827]">
          Elige tu usuario
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Será el nombre con el que otras personas podrán
          identificarte dentro de LookUp.
        </p>

      </div>

      <div className="mt-14">

        <div className="rounded-3xl border border-[#E5E7EB] bg-white px-6 py-5">

          <span className="text-slate-400">@</span>

          <input
            value={username}
            onChange={(e) =>
              onChange(normalize(e.target.value))
            }
            placeholder="crysc4rmon4"
            autoComplete="off"
            spellCheck={false}
            className="ml-2 w-[90%] bg-transparent text-lg font-semibold outline-none"
          />

        </div>

        <p className="mt-5 text-sm text-slate-400">
          Este nombre será visible para cualquier usuario.
        </p>

      </div>

    </section>
  );
}