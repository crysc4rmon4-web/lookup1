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

type Interest = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const OPTIONS: Interest[] = [
  {
    id: "gym",
    label: "Gym",
    icon: <Dumbbell size={18} />,
  },
  {
    id: "running",
    label: "Running",
    icon: <Trophy size={18} />,
  },
  {
    id: "cycling",
    label: "Ciclismo",
    icon: <Bike size={18} />,
  },
  {
    id: "travel",
    label: "Viajes",
    icon: <Plane size={18} />,
  },
  {
    id: "coffee",
    label: "Café",
    icon: <Coffee size={18} />,
  },
  {
    id: "food",
    label: "Gastronomía",
    icon: <Pizza size={18} />,
  },
  {
    id: "photography",
    label: "Fotografía",
    icon: <Camera size={18} />,
  },
  {
    id: "technology",
    label: "Tecnología",
    icon: <Laptop size={18} />,
  },
  {
    id: "programming",
    label: "Programación",
    icon: <Laptop size={18} />,
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: <Gamepad2 size={18} />,
  },
  {
    id: "music",
    label: "Música",
    icon: <Music4 size={18} />,
  },
  {
    id: "cinema",
    label: "Cine",
    icon: <Film size={18} />,
  },
  {
    id: "books",
    label: "Libros",
    icon: <BookOpen size={18} />,
  },
  {
    id: "entrepreneurship",
    label: "Emprendimiento",
    icon: <BriefcaseBusiness size={18} />,
  },
  {
    id: "pets",
    label: "Mascotas",
    icon: <PawPrint size={18} />,
  },
  {
    id: "sports",
    label: "Deportes",
    icon: <Trophy size={18} />,
  },
  {
    id: "networking",
    label: "Networking",
    icon: <Users size={18} />,
  },
  {
    id: "volunteering",
    label: "Voluntariado",
    icon: <HeartHandshake size={18} />,
  },
  {
    id: "nature",
    label: "Naturaleza",
    icon: <Map size={18} />,
  },
];

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

  return (<section className="flex min-h-[560px] flex-col">

    <div>

      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
        INTERESES
      </p>

      <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
        ¿Qué te interesa?
      </h2>

      <p className="mt-4 text-base leading-7 text-slate-500">
        Selecciona los temas que mejor te representan. Esto ayudará a mostrarte personas y eventos más relevantes para ti.
      </p>

    </div>

    <div className="mt-12 flex flex-wrap gap-3">

      {OPTIONS.map((option) => {

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
              {option.icon}
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