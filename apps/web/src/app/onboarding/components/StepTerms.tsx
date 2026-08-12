"use client";

import Link from "next/link";

type Props = {
  accepted: boolean;
  onChange: (value: boolean) => void;
};

export function StepTerms({ accepted, onChange }: Props) {
  return (
    <section className="flex min-h-[560px] flex-col">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          LEGAL
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          Términos y condiciones
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Antes de utilizar LookUp necesitamos tu consentimiento para el
          tratamiento de datos, la geolocalización y el uso responsable de la
          plataforma.
        </p>
      </div>

      <div className="mt-10 rounded-[28px] border border-[#E7E7EF] bg-white p-6">
        <h3 className="text-lg font-bold text-slate-900">Resumen</h3>

        <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <li>
            • Tu ubicación solo se utilizará para el funcionamiento del radar.
          </li>

          <li>• Tú decides qué información compartir con otros usuarios.</li>

          <li>• Puedes modificar o eliminar tu cuenta cuando quieras.</li>

          <li>
            • No está permitido publicar contenido ilegal o suplantar
            identidades.
          </li>

          <li>
            • Algunas funciones están destinadas únicamente a mayores de edad.
          </li>
        </ul>

        <div className="mt-8 flex flex-col gap-2 text-sm">
          <Link
            href="/legal/terms"
            target="_blank"
            className="font-semibold text-[#5D5FEF] hover:underline"
          >
            Leer Términos y Condiciones
          </Link>

          <Link
            href="/legal/privacy"
            target="_blank"
            className="font-semibold text-[#5D5FEF] hover:underline"
          >
            Leer Política de Privacidad
          </Link>
        </div>
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-4 rounded-2xl border border-[#E7E7EF] bg-[#FAFAFC] p-5">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-5 w-5 accent-[#5D5FEF]"
        />

        <span className="text-sm leading-6 text-slate-600">
          He leído y acepto los{" "}
          <span className="font-semibold text-[#5D5FEF]">
            Términos y Condiciones
          </span>{" "}
          y la{" "}
          <span className="font-semibold text-[#5D5FEF]">
            Política de Privacidad
          </span>
          .
        </span>
      </label>
    </section>
  );
}
