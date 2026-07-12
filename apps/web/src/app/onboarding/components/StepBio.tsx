"use client";

type StepBioProps = {
  bio: string;
  onChange: (value: string) => void;
};

export function StepBio({
  bio,
  onChange,
}: StepBioProps) {
  return (
    <section className="flex flex-col">
      <h2 className="text-3xl font-black text-slate-900">
        Cuéntanos de ti
      </h2>

      <p className="mt-2 text-slate-500">
        Una descripción corta.
      </p>

      <textarea
        rows={6}
        value={bio}
        onChange={(e) => onChange(e.target.value)}
        maxLength={180}
        className="mt-8 resize-none rounded-2xl border border-slate-200 p-5 outline-none focus:border-[#5D5FEF]"
        placeholder="Apasionado por el deporte, el café y conocer personas..."
      />

      <span className="mt-3 text-right text-xs text-slate-400">
        {bio.length}/180
      </span>
    </section>
  );
}