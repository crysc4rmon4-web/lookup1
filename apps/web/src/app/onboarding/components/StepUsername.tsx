"use client";

type StepUsernameProps = {
  username: string;
  onChange: (value: string) => void;
};

export function StepUsername({
  username,
  onChange,
}: StepUsernameProps) {
  return (
    <section className="flex min-h-[560px] flex-col">

      <div>

        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          PERFIL
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          Nombre de usuario
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Este será el nombre que verán los demás usuarios.
        </p>

      </div>

      <div className="mt-14 flex flex-col gap-3">

        <input
          value={username}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder="Nombre"
          autoComplete="off"
          spellCheck={false}
          className="
            w-full
            rounded-3xl
            border
            border-[#E5E7EB]
            bg-white
            px-6
            py-5
            text-lg
            font-semibold
            text-[#1F2937]
            outline-none
            transition-all
            placeholder:text-slate-400
            focus:border-[#5D5FEF]
          "
        />

        <div
          className="
            w-full
            rounded-3xl
            border
            border-[#E5E7EB]
            bg-[#F8FAFC]
            px-6
            py-4
          "
        >

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Username
          </p>

          <p className="mt-1 text-base font-semibold text-slate-700">
            @
            {username
              ? username
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9\s]/g, "")
                  .replace(/\s+/g, "-")
              : "usuario"}
          </p>

        </div>

      </div>

    </section>
  );
}