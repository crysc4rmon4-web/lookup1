"use client";

import { useMemo, useState } from "react";

import {
  SOCIAL_PLATFORMS,
  type Platform,
} from "@lookup/config";

import { Trash2 } from "lucide-react";

import { PlatformCard } from "@/components/ui/PlatformCard";
import { SocialIcon } from "@/components/ui/SocialIcon";

type Social = {
  platform: string;
  url: string;
};

type Props = {
  links: Social[];
  onChange: (links: Social[]) => void;
};

export function StepSocials({
  links,
  onChange,
}: Props) {
  const [showAll, setShowAll] =
    useState(false);

  const selected = useMemo(
    () =>
      new Set(
        links.map(
          (item) => item.platform,
        ),
      ),
    [links],
  );

  const platforms = showAll
    ? SOCIAL_PLATFORMS.filter(
      (item) => item.enabled,
    )
    : SOCIAL_PLATFORMS.filter(
      (item) =>
        item.enabled &&
        item.featured,
    );

  function toggle(platform: Platform) {
    if (selected.has(platform.id)) {
      onChange(
        links.filter(
          (item) =>
            item.platform !== platform.id,
        ),
      );

      return;
    }

    onChange([
      ...links,
      {
        platform: platform.id,
        url: "",
      },
    ]);
  }

  function update(
    platformId: string,
    value: string,
  ) {
    onChange(
      links.map((item) =>
        item.platform === platformId
          ? {
            ...item,
            url: value,
          }
          : item,
      ),
    );
  }

  function remove(
    platformId: string,
  ) {
    onChange(
      links.filter(
        (item) =>
          item.platform !== platformId,
      ),
    );
  }

  function normalizedPreview(
    value: string,
  ) {
    return value.trim();
  }

  return (<section className="flex flex-col">

    <div>

      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
        REDES SOCIALES
      </p>

      <h2 className="mt-4 text-4xl font-black leading-tight text-slate-900">
        Comparte tus redes sociales
      </h2>

      <p className="mt-4 text-base leading-7 text-slate-500">
        Selecciona únicamente las plataformas donde quieras que otros usuarios
        puedan encontrarte. Siempre podrás modificarlas más adelante.
      </p>

    </div>

    <div className="mt-10 grid grid-cols-3 gap-4 md:grid-cols-4">

      {platforms.map((platform) => (

        <PlatformCard
          key={platform.id}
          platform={platform.id}
          label={platform.name}
          selected={selected.has(platform.id)}
          onClick={() => toggle(platform)}
        />

      ))}

    </div>

    <div className="mt-6 flex justify-center">

      <button
        type="button"
        onClick={() =>
          setShowAll(!showAll)
        }
        className="text-sm font-bold text-[#5D5FEF] transition hover:opacity-80"
      >
        {showAll
          ? "Ver menos"
          : "Ver más redes"}
      </button>

    </div>

    <div className="mt-8 space-y-5">

      {links.map((link) => {

        const platform =
          SOCIAL_PLATFORMS.find(
            (item) =>
              item.id ===
              link.platform,
          );

        if (!platform) {
          return null;
        }

        return (

          <div
            key={platform.id}
            className="rounded-[28px] border border-[#E7E7EF] bg-white p-6 shadow-sm transition-all"
          >

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5D5FEF]">

                  <SocialIcon
                    platform={platform.id}
                    size={22}
                  />

                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    {platform.name}
                  </h3>

                  <p className="text-xs text-slate-400">
                    {platform.prefix ??
                      "Enlace personalizado"}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  remove(platform.id)
                }
                className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Eliminar red social"
              >
                <Trash2 size={18} />
              </button>

            </div>

            <input
              value={link.url}
              onChange={(event) =>
                update(
                  platform.id,
                  event.target.value,
                )
              }
              placeholder={
                platform.placeholder
              }
              className="
                  mt-5
                  w-full
                  rounded-2xl
                  border
                  border-[#E5E7EB]
                  bg-[#FAFAFC]
                  px-5
                  py-4
                  text-[15px]
                  font-medium
                  text-slate-700
                  placeholder:text-slate-500
                  outline-none
                  transition-all
                  focus:border-[#5D5FEF]
                "
            />

            {platform.id ===
              "onlyfans" && (

                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">

                  <p className="text-xs font-medium text-amber-700">
                    🔞 Solo selecciona esta plataforma si eres mayor de 18 años.
                  </p>

                </div>

              )}

            {platform.prefix && (

              <p className="mt-3 break-all text-xs text-slate-400">

                {platform.prefix}
                {normalizedPreview(
                  link.url,
                ) ||
                  platform.placeholder}

              </p>

            )}

          </div>

        );

      })}

    </div>

  </section>
  );
}