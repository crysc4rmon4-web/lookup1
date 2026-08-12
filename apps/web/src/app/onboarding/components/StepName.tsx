"use client";

type StepNameProps = {
  fullName: string;
  onChange: (value: string) => void;
};

export function StepName({ fullName, onChange }: StepNameProps) {
  const username = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");
  return (
    <section className="flex min-h-[560px] flex-col">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          PERFIL
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          Tu nombre
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Este será el nombre que verán las demás personas.
        </p>
      </div>

      <div className="mt-14">
        <input
          value={fullName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre"
          autoComplete="name"
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
        <div className="mt-4">
          <p className="text-sm text-slate-500">
            Username:
            <span className="ml-2 font-semibold text-[#5D5FEF]">
              @{username || "usuario"}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
