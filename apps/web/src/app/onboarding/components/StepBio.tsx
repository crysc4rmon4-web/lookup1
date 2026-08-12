"use client";

type StepBioProps = {
  bio: string;
  onChange: (value: string) => void;
};

export function StepBio({ bio, onChange }: StepBioProps) {
  return (
    <section className="flex min-h-[560px] flex-col">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          PERFIL
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          Sobre ti
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Escribe una pequeña descripción para que los demás sepan quién eres.
        </p>
      </div>

      <div className="mt-14">
        <textarea
          rows={6}
          value={bio}
          onChange={(e) => onChange(e.target.value)}
          maxLength={180}
          placeholder="Escribe una breve presentación..."
          className="
            w-full
            resize-none
            rounded-3xl
            border
            border-[#E5E7EB]
            bg-white
            px-6
            py-5
            text-base
            leading-7
            font-medium
            text-slate-700
            placeholder:text-slate-400
            outline-none
            transition-all
            focus:border-[#5D5FEF]
          "
        />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Máx. 180 caracteres.</p>

          <span className="text-sm font-semibold text-slate-400">
            {bio.length}/180
          </span>
        </div>
      </div>
    </section>
  );
}
