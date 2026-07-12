"use client";

type StepNameProps = {
  fullName: string;
  onChange: (value: string) => void;
};

export function StepName({
  fullName,
  onChange,
}: StepNameProps) {
  return (
    <section className="flex flex-col">
      <h2 className="text-3xl font-black text-slate-900">
        Tu nombre
      </h2>

      <p className="mt-2 text-slate-500">
        Es el nombre que verán los demás usuarios.
      </p>

      <input
        value={fullName}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cristian Carmona"
        className="mt-10 rounded-2xl border border-slate-200 p-5 text-lg outline-none focus:border-[#5D5FEF]"
      />
    </section>
  );
}