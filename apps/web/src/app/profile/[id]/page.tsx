"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Globe2,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPublicProfileById,
  getPublicProfileLinks,
  type ProfileLink,
  type PublicProfile,
} from "@lookup/services";

import { SocialIcon } from "@/components/ui/SocialIcon";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizePlatform(platform: string) {
  const normalized = platform
    .trim()
    .toLowerCase();

  if (normalized === "twitter") {
    return "x";
  }

  if (normalized === "web") {
    return "website";
  }

  return normalized;
}

function getPlatformLabel(platform: string) {
  const normalized = normalizePlatform(platform);

  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    threads: "Threads",
    x: "X",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    github: "GitHub",
    gitlab: "GitLab",
    behance: "Behance",
    dribbble: "Dribbble",
    youtube: "YouTube",
    twitch: "Twitch",
    kick: "Kick",
    discord: "Discord",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    spotify: "Spotify",
    steam: "Steam",
    playstation: "PlayStation",
    xbox: "Xbox",
    patreon: "Patreon",
    kofi: "Ko-fi",
    buymeacoffee: "Buy Me a Coffee",
    onlyfans: "OnlyFans",
    reddit: "Reddit",
    pinterest: "Pinterest",
    bluesky: "Bluesky",
    snapchat: "Snapchat",
    website: "Web",
  };

  return labels[normalized] ?? platform;
}

function normalizeExternalUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return "#";
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normalizeComparableUrl(url: string) {
  return normalizeExternalUrl(url)
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="h-10 w-32 animate-pulse rounded-full bg-white" />

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-[#ECEFF5] bg-white shadow-sm">
          <div className="h-32 animate-pulse bg-[#EEF2FF]" />

          <div className="px-5 pb-8 sm:px-8">
            <div className="-mt-14 h-28 w-28 animate-pulse rounded-full border-4 border-white bg-slate-200" />

            <div className="mt-5 h-8 w-52 animate-pulse rounded-lg bg-slate-200" />

            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-100" />

            <div className="mt-8 h-24 animate-pulse rounded-2xl bg-slate-50" />

            <div className="mt-5 h-24 animate-pulse rounded-2xl bg-slate-50" />
          </div>
        </div>
      </div>
    </main>
  );
}

function SocialLinks({
  links,
}: {
  links: ProfileLink[];
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            CONECTA
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-900">
            Redes y enlaces
          </h2>
        </div>

        <Globe2
          size={18}
          className="shrink-0 text-slate-300"
          aria-hidden="true"
        />
      </div>

      <p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">
        Sigue su trabajo, contenido o proyectos fuera de LookUp.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((link) => {
          const platform =
            normalizePlatform(link.platform);

          return (
            <a
              key={link.id}
              href={normalizeExternalUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group
                flex
                min-w-0
                items-center
                gap-3
                rounded-2xl
                border
                border-[#ECEFF5]
                bg-white
                p-3.5
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-[#DCDFFF]
                hover:bg-[#FAFAFF]
                hover:shadow-sm
              "
            >
              <span
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#EEF2FF]
                  text-[#5D5FEF]
                  transition
                  group-hover:bg-[#5D5FEF]
                  group-hover:text-white
                "
              >
                <SocialIcon
                  platform={platform}
                  size={20}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-800">
                  {getPlatformLabel(platform)}
                </span>

                <span className="mt-0.5 block truncate text-xs text-slate-400">
                  {link.url}
                </span>
              </span>

              <ArrowUpRight
                size={16}
                className="
                  shrink-0
                  text-slate-300
                  transition
                  group-hover:text-[#5D5FEF]
                "
                aria-hidden="true"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default function ProfilePage({
  params,
}: Props) {
  const { id } = use(params);

  const [profile, setProfile] =
    useState<PublicProfile | null>(null);

  const [links, setLinks] =
    useState<ProfileLink[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const [
          publicProfile,
          publicLinks,
        ] = await Promise.all([
          getPublicProfileById(id),
          getPublicProfileLinks(id),
        ]);

        if (cancelled) {
          return;
        }

        if (!publicProfile) {
          setProfile(null);
          setLinks([]);
          setError(
            "Este perfil no existe o no está disponible públicamente.",
          );

          return;
        }

        setProfile(publicProfile);

        setLinks(
          publicLinks.filter(
            (link) => link.url.trim().length > 0,
          ),
        );
      } catch (loadError) {
        console.error(
          "❌ Error cargando perfil público",
          loadError,
        );

        if (!cancelled) {
          setProfile(null);
          setLinks([]);
          setError(
            "No hemos podido cargar este perfil.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const visibleLinks = useMemo(() => {
    if (!profile) {
      return [];
    }

    /*
     * Si Business ya tiene website en su perfil
     * comercial y profile_links contiene exactamente
     * la misma URL, evitamos mostrarla dos veces.
     */
    if (
      profile.account_type !== "business" ||
      !profile.business_website?.trim()
    ) {
      return links;
    }

    const businessWebsite =
      normalizeComparableUrl(
        profile.business_website,
      );

    return links.filter((link) => {
      const platform =
        normalizePlatform(link.platform);

      if (platform !== "website") {
        return true;
      }

      return (
        normalizeComparableUrl(link.url) !==
        businessWebsite
      );
    });
  }, [links, profile]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 sm:px-6">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
          <section className="w-full rounded-[2rem] border border-[#ECEFF5] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF2FF]">
              <UserRound
                size={24}
                className="text-[#5D5FEF]"
              />
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-900">
              Perfil no disponible
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {error ??
                "Este perfil no existe o ya no está disponible."}
            </p>

            <Link
              href="/dashboard"
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-[#5D5FEF]
                px-5
                py-3
                text-sm
                font-black
                text-white
                transition
                hover:bg-[#4F51DC]
              "
            >
              <ArrowLeft size={16} />
              Volver al radar
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const isBusiness =
    profile.account_type === "business";

  const displayName =
    profile.display_name.trim() ||
    (isBusiness
      ? "Negocio LookUp"
      : "Usuario LookUp");

  const profession =
    profile.profession?.trim();

  const bio =
    profile.bio?.trim();

  const interests =
    Array.isArray(profile.interests)
      ? profile.interests.filter(
          (interest) =>
            typeof interest === "string" &&
            interest.trim().length > 0,
        )
      : [];

  const businessSector =
    profile.business_sector?.trim();

  const businessCity =
    profile.business_city?.trim();

  const businessProvince =
    profile.business_province?.trim();

  const businessWebsite =
    profile.business_website?.trim();

  const personCity =
    profile.city?.trim();

  const businessLocation = [
    businessCity,
    businessProvince &&
    businessProvince.toLowerCase() !==
      businessCity?.toLowerCase()
      ? businessProvince
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-white
            px-4
            py-2.5
            text-sm
            font-bold
            text-slate-600
            shadow-sm
            transition
            hover:text-[#5D5FEF]
          "
        >
          <ArrowLeft size={16} />
          Volver al radar
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#ECEFF5] bg-white shadow-sm">
          <div
            className={[
              "relative h-32 overflow-hidden sm:h-40",
              isBusiness
                ? "bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#EEF2FF]"
                : "bg-gradient-to-br from-[#EEF2FF] via-white to-[#F5F3FF]",
            ].join(" ")}
          >
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

            <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-[#5D5FEF]/10 blur-3xl" />
          </div>

          <div className="px-5 pb-7 sm:px-8 sm:pb-9">
            <div className="-mt-14 flex items-end justify-between gap-4 sm:-mt-16">
              <div
                className={[
                  "relative h-28 w-28 shrink-0 overflow-hidden",
                  "border-4 border-white bg-[#EEF2FF] shadow-md",
                  "sm:h-32 sm:w-32",
                  isBusiness
                    ? "rounded-[2rem]"
                    : "rounded-full",
                ].join(" ")}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={
                      isBusiness
                        ? `Imagen de ${displayName}`
                        : `Foto de ${displayName}`
                    }
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-[#5D5FEF]">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>

              <span
                className="
                  mb-2
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-full
                  bg-[#EEF2FF]
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-[#5D5FEF]
                "
              >
                {isBusiness ? (
                  <Building2 size={12} />
                ) : (
                  <UserRound size={12} />
                )}

                {isBusiness
                  ? "Negocio local"
                  : "Persona"}
              </span>
            </div>

            <div className="mt-5">
              <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {displayName}
              </h1>

              {profile.username ? (
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  @{profile.username}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {isBusiness ? (
                  <>
                    {businessSector ? (
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          bg-[#EEF2FF]
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                          text-[#5D5FEF]
                        "
                      >
                        <BriefcaseBusiness size={13} />
                        {businessSector}
                      </span>
                    ) : null}

                    {businessLocation ? (
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          bg-slate-50
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                          text-slate-600
                        "
                      >
                        <MapPin size={13} />
                        {businessLocation}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    {profession ? (
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          bg-[#EEF2FF]
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                          text-[#5D5FEF]
                        "
                      >
                        <BriefcaseBusiness size={13} />
                        {profession}
                      </span>
                    ) : null}

                    {personCity ? (
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          bg-slate-50
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                          text-slate-600
                        "
                      >
                        <MapPin size={13} />
                        {personCity}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {isBusiness && businessWebsite ? (
              <a
                href={normalizeExternalUrl(
                  businessWebsite,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  mt-6
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-4
                  rounded-2xl
                  bg-[#5D5FEF]
                  px-4
                  py-3.5
                  text-white
                  shadow-sm
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-[#5153E6]
                  hover:shadow-md
                "
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Globe2 size={18} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-white/70">
                      Sitio web
                    </span>

                    <span className="block truncate text-sm font-black">
                      {businessWebsite}
                    </span>
                  </span>
                </span>

                <ExternalLink
                  size={16}
                  className="shrink-0"
                />
              </a>
            ) : null}

            {bio ? (
              <section className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  {isBusiness
                    ? "SOBRE EL NEGOCIO"
                    : "SOBRE MÍ"}
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                  {bio}
                </p>
              </section>
            ) : null}

            {interests.length > 0 ? (
              <section className="mt-8">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={14}
                    className="text-[#5D5FEF]"
                  />

                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {isBusiness
                      ? "TEMAS Y CATEGORÍAS"
                      : "INTERESES"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="
                        rounded-full
                        border
                        border-[#E5E7FF]
                        bg-[#F5F5FF]
                        px-3.5
                        py-2
                        text-xs
                        font-bold
                        text-[#5D5FEF]
                      "
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <SocialLinks
              links={visibleLinks}
            />

            {!bio &&
            interests.length === 0 &&
            visibleLinks.length === 0 &&
            !businessWebsite ? (
              <section className="mt-8 rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  {isBusiness
                    ? "Este negocio todavía no ha añadido más información pública."
                    : "Esta persona todavía no ha añadido más información pública."}
                </p>
              </section>
            ) : null}

            <section
              className="
                mt-8
                rounded-2xl
                border
                border-[#E8E9FF]
                bg-[#F8F8FF]
                p-4
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#EEF2FF]
                    text-[#5D5FEF]
                  "
                >
                  <Sparkles size={16} />
                </div>

                <div>
                  <p className="text-sm font-black text-slate-800">
                    Descubierto con LookUp
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {isBusiness
                      ? "LookUp te ayuda a descubrir negocios y actividades relevantes cerca de ti."
                      : "LookUp te ayuda a descubrir personas relevantes cerca de ti según contexto e intereses."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}