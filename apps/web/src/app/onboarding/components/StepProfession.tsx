"use client";

type StepProfessionProps = {
  profession: string;
  onChange: (value: string) => void;
};

export function StepProfession({ profession, onChange }: StepProfessionProps) {
  return (
    <section className="flex min-h-[560px] flex-col">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          PERFIL
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          Profesión
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Opcional. Ayudará a que otras personas sepan a qué te dedicas.
        </p>
      </div>

      <div className="mt-14">
        <input
          value={profession}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej. Diseñador UX, Desarrollador..."
          autoComplete="organization-title"
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
      </div>

      <div className="mt-auto pt-8">
        <p className="text-sm text-slate-500">Este campo es opcional.</p>
      </div>
    </section>
  );
}
