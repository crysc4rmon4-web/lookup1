"use client";

import {
  Bike,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Coffee,
  Dumbbell,
  Film,
  Gamepad2,
  HeartHandshake,
  Laptop,
  Map,
  Music4,
  PawPrint,
  Pizza,
  Plane,
  Trophy,
  Users,
} from "lucide-react";

import { INTEREST_OPTIONS } from "@lookup/config";

const INTEREST_ICONS = {
  gym: <Dumbbell size={18} />,
  running: <Trophy size={18} />,
  cycling: <Bike size={18} />,
  travel: <Plane size={18} />,
  coffee: <Coffee size={18} />,
  food: <Pizza size={18} />,
  photography: <Camera size={18} />,
  technology: <Laptop size={18} />,
  programming: <Laptop size={18} />,
  gaming: <Gamepad2 size={18} />,
  music: <Music4 size={18} />,
  cinema: <Film size={18} />,
  books: <BookOpen size={18} />,
  entrepreneurship: (
    <BriefcaseBusiness size={18} />
  ),
  pets: <PawPrint size={18} />,
  sports: <Trophy size={18} />,
  networking: <Users size={18} />,
  volunteering: (
    <HeartHandshake size={18} />
  ),
  nature: <Map size={18} />,
} as const;

type Props = {
  interests: string[];
  onChange: (value: string[]) => void;
};

export function StepInterests({
  interests,
  onChange,
}: Props) {
  function toggle(id: string) {
    if (interests.includes(id)) {
      onChange(
        interests.filter(
          (item) => item !== id,
        ),
      );

      return;
    }

    onChange([
      ...interests,
      id,
    ]);
  }

  return (
    <section className="flex min-h-[560px] flex-col">

      <div>

        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          INTERESES
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          ¿Qué te interesa?
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Selecciona los temas que mejor te representan.
          Esto ayudará a mostrarte personas y eventos
          más relevantes para ti.
        </p>

      </div>

      <div className="mt-12 flex flex-wrap gap-3">

        {INTEREST_OPTIONS.map((option) => {

          const active =
            interests.includes(option.id);

          return (

            <button
              key={option.id}
              type="button"
              onClick={() =>
                toggle(option.id)
              }
              className={[
                "flex items-center gap-2 rounded-full border px-5 py-3 transition-all duration-200",
                active
                  ? "border-[#5D5FEF] bg-[#5D5FEF] text-white shadow-sm"
                  : "border-[#E5E7EB] bg-white text-slate-700 hover:border-[#5D5FEF]",
              ].join(" ")}
            >

              <span
                className={
                  active
                    ? "text-white"
                    : "text-slate-500"
                }
              >
                {
                  INTEREST_ICONS[
                  option.id as keyof typeof INTEREST_ICONS
                  ]
                }
              </span>

              <span className="text-sm font-semibold">
                {option.label}
              </span>

            </button>

          );

        })}

      </div>

      <div className="mt-auto pt-8">

        <p className="text-sm text-slate-500">

          {interests.length === 0
            ? "Puedes continuar sin seleccionar intereses."
            : `${interests.length} ${interests.length === 1
              ? "interés seleccionado"
              : "intereses seleccionados"
            }`}

        </p>

      </div>

    </section>
  );
}