"use client";

import { Plus, Trash2 } from "lucide-react";

type Social = {
  platform: string;
  url: string;
};

type Props = {
  links: Social[];
  onChange: (links: Social[]) => void;
};

const PLATFORMS = [
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Github",
  "Facebook",
  "X",
];

export function StepSocials({
  links,
  onChange,
}: Props) {
  function add() {
    onChange([
      ...links,
      {
        platform: "Instagram",
        url: "",
      },
    ]);
  }

  function update(
    index: number,
    field: keyof Social,
    value: string,
  ) {
    const copy = [...links];

    if (!copy[index]) return;

    copy[index] = {
      ...copy[index],
      [field]: value,
    };

    onChange(copy);
  }

  function remove(index: number) {
    onChange(
      links.filter((_, i) => i !== index),
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">
            Redes sociales
          </h2>

          <p className="mt-2 text-slate-500">
            Añade las que quieras mostrar.
          </p>
        </div>

        <button
          type="button"
          onClick={add}
          className="rounded-xl bg-[#5D5FEF] p-3 text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-8 space-y-5">
        {links.map((link, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <select
              value={link.platform}
              onChange={(e) =>
                update(
                  index,
                  "platform",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border p-3"
            >
              {PLATFORMS.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <input
              value={link.url}
              onChange={(e) =>
                update(
                  index,
                  "url",
                  e.target.value,
                )
              }
              className="mt-3 w-full rounded-xl border p-3"
              placeholder="https://..."
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-3 flex items-center gap-2 text-red-500"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}