"use client";

const OPTIONS = [
  "Running",
  "Gym",
  "Ciclismo",
  "Senderismo",
  "Viajes",
  "Fotografía",
  "Tecnología",
  "Programación",
  "Gaming",
  "Música",
  "Arte",
  "Emprendimiento",
];

type Props = {
  interests: string[];
  onChange: (value: string[]) => void;
};

export function StepInterests({
  interests,
  onChange,
}: Props) {
  function toggle(option: string) {
    if (interests.includes(option)) {
      onChange(interests.filter((i) => i !== option));
      return;
    }

    onChange([...interests, option]);
  }

  return (
    <section>

      <h2 className="text-3xl font-black">
        Tus intereses
      </h2>

      <p className="mt-2 text-slate-500">
        Selecciona los que mejor te representen.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">

        {OPTIONS.map((option) => {

          const active =
            interests.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-full px-5 py-3 font-bold transition ${
                active
                  ? "bg-[#5D5FEF] text-white"
                  : "bg-slate-100"
              }`}
            >
              {option}
            </button>
          );
        })}

      </div>

    </section>
  );
}