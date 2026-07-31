"use client";

import { useMemo, useState } from "react";

import {
  SiInstagram,
  SiTiktok,
  SiThreads,
  SiX,
  SiFacebook,
  SiGithub,
  SiGitlab,
  SiBehance,
  SiDribbble,
  SiYoutube,
  SiTwitch,
  SiKick,
  SiDiscord,
  SiTelegram,
  SiWhatsapp,
  SiSpotify,
  SiSteam,
  SiPlaystation,
  SiPatreon,
  SiKofi,
  SiBuymeacoffee,
  SiOnlyfans,
  SiReddit,
  SiPinterest,
  SiBluesky,
  SiSnapchat,
} from "@icons-pack/react-simple-icons";

import { Globe } from "lucide-react";

import {
  SOCIAL_PLATFORMS,
  type Platform,
} from "@lookup/config";

import { PlatformCard } from "@/components/ui/PlatformCard";

type Social = {
  platform: string;
  url: string;
};

type Props = {
  links: Social[];
  onChange: (links: Social[]) => void;
};

const ICONS: Record<string, React.ReactNode> = {
  instagram: <SiInstagram size={24} />,
  tiktok: <SiTiktok size={24} />,
  threads: <SiThreads size={24} />,
  x: <SiX size={24} />,
  facebook: <SiFacebook size={24} />,
  linkedin: "💼",
  github: <SiGithub size={24} />,
  gitlab: <SiGitlab size={24} />,
  behance: <SiBehance size={24} />,
  dribbble: <SiDribbble size={24} />,
  youtube: <SiYoutube size={24} />,
  twitch: <SiTwitch size={24} />,
  kick: <SiKick size={24} />,
  discord: <SiDiscord size={24} />,
  telegram: <SiTelegram size={24} />,
  whatsapp: <SiWhatsapp size={24} />,
  spotify: <SiSpotify size={24} />,
  steam: <SiSteam size={24} />,
  playstation: <SiPlaystation size={24} />,
  xbox: "🎮",
  patreon: <SiPatreon size={24} />,
  kofi: <SiKofi size={24} />,
  buymeacoffee: <SiBuymeacoffee size={24} />,
  onlyfans: <SiOnlyfans size={24} />,
  reddit: <SiReddit size={24} />,
  pinterest: <SiPinterest size={24} />,
  bluesky: <SiBluesky size={24} />,
  snapchat: <SiSnapchat size={24} />,
  website: <Globe size={24} />,
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
        links.map((item) => item.platform),
      ),
    [links],
  );

  const platforms = showAll
    ? SOCIAL_PLATFORMS.filter(
      (platform) => platform.enabled,
    )
    : SOCIAL_PLATFORMS.filter(
      (platform) =>
        platform.enabled &&
        platform.featured,
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

  return (
    <section className="flex flex-col">
      <div>

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5D5FEF]">
          REDES SOCIALES
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-slate-900">
          ¿Dónde pueden encontrarte?
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Elige únicamente las plataformas que quieras compartir.
          Más adelante podrás modificarlas cuando quieras.
        </p>

      </div>

      <div className="mt-10 grid grid-cols-3 gap-4">

        {platforms.map((platform) => (

          <PlatformCard
            key={platform.id}
            label={platform.name}
            icon={
              ICONS[platform.id] ?? (
                <Globe size={24} />
              )
            }
            selected={selected.has(platform.id)}
            onClick={() => toggle(platform)}
          />

        ))}

      </div>

      {!showAll && SOCIAL_PLATFORMS.length > platforms.length && (

        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-6 text-center text-sm font-bold text-[#5D5FEF]"
        >
          Ver todas las plataformas
        </button>

      )}

      <div className="mt-10 space-y-6">

        {links.map((link) => {

          const platform =
            SOCIAL_PLATFORMS.find(
              (item) =>
                item.id === link.platform,
            );

          if (!platform) {
            return null;
          }

          return (

            <div
              key={platform.id}
              className="rounded-[28px] border border-[#E7E7EF] bg-white p-6 shadow-sm"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5D5FEF]">

                  {ICONS[platform.id] ?? (
                    <Globe size={22} />
                  )}

                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    {platform.name}
                  </h3>

                  <p className="text-xs text-slate-400">
                    {platform.prefix || "Enlace personalizado"}
                  </p>

                </div>

              </div>

              <input
                value={link.url}
                onChange={(event) =>
                  update(
                    platform.id,
                    event.target.value,
                  )
                }
                placeholder={platform.placeholder}
                className="mt-5 w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFC] px-5 py-4 text-[15px] outline-none transition-all focus:border-[#5D5FEF]"
              />

              {platform.prefix && (

                <p className="mt-3 break-all text-xs text-slate-400">

                  {platform.prefix}
                  {link.url || platform.placeholder}

                </p>

              )}

            </div>

          );

        })}

      </div>

    </section>
  );
}