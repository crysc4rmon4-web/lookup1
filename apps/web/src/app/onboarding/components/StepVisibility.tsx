"use client";

type StepVisibilityProps = {
  visibility: boolean;
  onChange: (value: boolean) => void;
};

export function StepVisibility({
  visibility,
  onChange,
}: StepVisibilityProps) {
  return (
    <section className="flex flex-col">
      <h2 className="text-3xl font-black text-slate-900">
        Visibilidad
      </h2>

      <p className="mt-2 text-slate-500">
        Decide si aparecerás en el radar.
      </p>

      <button
        type="button"
        onClick={() => onChange(!visibility)}
        className="mt-10 flex items-center justify-between rounded-2xl border border-slate-200 p-5"
      >
        <span className="font-bold">
          Mostrar mi perfil
        </span>

        <span
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            visibility
              ? "bg-emerald-500 text-white"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {visibility ? "ACTIVO" : "OCULTO"}
        </span>
      </button>
    </section>
  );
}