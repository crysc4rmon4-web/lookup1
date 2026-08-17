"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Globe2,
  MapPin,
  Maximize2,
  Sparkles,
  UserRound,
  X,
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

import {
  SocialIcon,
} from "@/components/ui/SocialIcon";

import {
  useAuth,
} from "@/components/auth-provider";

import {
  getProfileMatchExplanation,
  type ProfileMatchExplanationResult,
} from "@/services/ai/get-profile-match-explanation";

import {
  buildSocialProfileUrl,
  normalizeSocialPlatform,
  getSocialPlatformLabel,
  normalizeWebsiteUrl,
} from "@/lib/social-profile-url";

type Props = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    from?: string | string[];
  }>;
};

function getInitials(
  name: string,
) {
  return name
    .split(" ")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0),
    )
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizeComparableUrl(
  value: string,
) {
  const normalized =
    normalizeWebsiteUrl(
      value,
    );

  if (!normalized) {
    return "";
  }

  return normalized
    .replace(
      /^https?:\/\//i,
      "",
    )
    .replace(
      /^www\./i,
      "",
    )
    .replace(
      /\/+$/,
      "",
    )
    .toLowerCase();
}

function formatInterest(
  value: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    return "";
  }

  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function getConnectionLabel(
  score: number,
) {
  if (score >= 85) {
    return "Conexión excepcional";
  }

  if (score >= 70) {
    return "Muy buena conexión";
  }

  if (score >= 55) {
    return "Buena conexión";
  }

  if (score >= 40) {
    return "Hay puntos en común";
  }

  return "Conexión por explorar";
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <section className="overflow-hidden rounded-[36px] border border-[#ECEFF5] bg-white shadow-sm">
          <div className="h-56 animate-pulse bg-[#EEF2FF] sm:h-64" />

          <div className="px-5 pb-8 sm:px-8">
            <div className="mx-auto -mt-[74px] h-[148px] w-[148px] animate-pulse rounded-full border-[5px] border-white bg-slate-200" />

            <div className="mx-auto mt-6 h-9 w-52 animate-pulse rounded-lg bg-slate-200" />

            <div className="mx-auto mt-3 h-4 w-32 animate-pulse rounded bg-slate-100" />

            <div className="mt-8 h-24 animate-pulse rounded-2xl bg-slate-50" />
          </div>
        </section>
      </div>
    </main>
  );
}

function SocialLinks({
  links,
}: {
  links: ProfileLink[];
}) {
  const resolvedLinks =
    links
      .map((link) => {
        const platform =
          normalizeSocialPlatform(
            link.platform,
          );

        const href =
          buildSocialProfileUrl(
            platform,
            link.url,
          );

        if (!href) {
          return null;
        }

        return {
          link,
          platform,
          href,
        };
      })
      .filter(
        (
          item,
        ): item is {
          link: ProfileLink;
          platform: string;
          href: string;
        } =>
          item !== null,
      );

  if (
    resolvedLinks.length ===
    0
  ) {
    return null;
  }

  return (
    <section className="mt-9">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5D5FEF]">
            CONECTA
          </p>

          <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-900">
            Continúa la conexión
          </h2>

          <p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">
            Descubre su contenido, trabajo y comunidad también fuera de LookUp.
          </p>
        </div>

        <Globe2
          size={18}
          className="mb-1 shrink-0 text-slate-300"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {resolvedLinks.map(
          ({
            link,
            platform,
            href,
          }) => (
            <a
              key={link.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group
                flex
                min-w-0
                items-center
                gap-3
                rounded-[22px]
                border
                border-[#E9ECF4]
                bg-white
                p-4
                transition-all
                duration-200
                hover:-translate-y-1
                hover:border-[#D6DAFF]
                hover:shadow-[0_14px_35px_rgba(73,72,180,0.10)]
              "
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0F2FF] text-[#5D5FEF] transition-all group-hover:scale-105 group-hover:bg-[#5D5FEF] group-hover:text-white">
                <SocialIcon
                  platform={platform}
                  size={21}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-900">
                  {getSocialPlatformLabel(
                    platform,
                  )}
                </span>

                <span className="mt-1 block truncate text-xs font-medium text-slate-400">
                  {link.url}
                </span>
              </span>

              <ArrowUpRight
                size={16}
                className="shrink-0 text-slate-300 transition group-hover:text-[#5D5FEF]"
              />
            </a>
          ),
        )}
      </div>
    </section>
  );
}

function MatchExplanation({
  result,
  isBusiness,
}: {
  result:
    ProfileMatchExplanationResult;

  isBusiness: boolean;
}) {
  if (
    !result.available ||
    result.matchScore ===
      null ||
    !result.explanation
  ) {
    return null;
  }

  const sharedInterests =
    result.sharedInterests
      .map(formatInterest)
      .filter(Boolean);

  return (
    <section className="relative mt-8 overflow-hidden rounded-[26px] border border-[#E1E2FA] bg-gradient-to-br from-[#FAFAFF] via-white to-[#F5F2FF] p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#5D5FEF]/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#5D5FEF] text-white shadow-[0_10px_24px_rgba(93,95,239,0.22)]">
            <Sparkles
              size={18}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#5D5FEF]">
                  LOOKUP AI
                </p>

                <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                  {isBusiness
                    ? "Por qué puede interesarte este negocio"
                    : "Por qué puede interesarte esta persona"}
                </h2>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[22px] font-black tracking-tight text-[#5D5FEF]">
                  {result.matchScore}
                  <span className="text-xs">
                    %
                  </span>
                </p>

                <p className="max-w-[105px] text-[9px] font-bold leading-4 text-slate-400">
                  {getConnectionLabel(
                    result.matchScore,
                  )}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {result.explanation}
            </p>

            {sharedInterests.length >
            0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {sharedInterests.map(
                  (interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-[#E5E6F7] bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm"
                    >
                      {interest}
                    </span>
                  ),
                )}
              </div>
            ) : null}

            <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">
              {result.source ===
              "ai"
                ? "Explicación generada por LookUp AI"
                : "Explicación de respaldo de LookUp"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage({
  params,
  searchParams,
}: Props) {
  const {
    id,
  } = use(params);

  const query =
    use(searchParams);

  const {
    session,
    user,
  } =
    useAuth();

  const rawFrom =
    query.from;

  const from =
    Array.isArray(
      rawFrom,
    )
      ? rawFrom[0]
      : rawFrom;

  const fromSettings =
    from === "settings";

  const backHref =
    fromSettings
      ? "/dashboard?section=settings"
      : "/dashboard?section=radar";

  const backLabel =
    fromSettings
      ? "Ajustes"
      : "Radar";

  const [
    profile,
    setProfile,
  ] =
    useState<PublicProfile | null>(
      null,
    );

  const [
    links,
    setLinks,
  ] =
    useState<ProfileLink[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    photoOpen,
    setPhotoOpen,
  ] =
    useState(false);

  const [
    matchResult,
    setMatchResult,
  ] =
    useState<ProfileMatchExplanationResult | null>(
      null,
    );

  const [
    matchLoading,
    setMatchLoading,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const [
          publicProfile,
          publicLinks,
        ] =
          await Promise.all([
            getPublicProfileById(
              id,
            ),

            getPublicProfileLinks(
              id,
            ),
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

        setProfile(
          publicProfile,
        );

        setLinks(
          publicLinks.filter(
            (link) =>
              link.url
                .trim()
                .length >
              0,
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
      cancelled =
        true;
    };
  }, [
    id,
  ]);

  useEffect(() => {
    let cancelled =
      false;

    const accessToken =
      session?.access_token
        ?.trim();

    if (
      !profile ||
      fromSettings ||
      user?.id === id ||
      !accessToken
    ) {
      setMatchResult(null);
      setMatchLoading(false);

      return;
    }

    const validAccessToken =
      accessToken;

    async function loadMatchExplanation() {
      setMatchLoading(true);

      try {
        const result =
          await getProfileMatchExplanation(
            validAccessToken,
            id,
          );

        if (!cancelled) {
          setMatchResult(
            result,
          );
        }
      } catch (matchError) {
        console.error(
          "❌ Error cargando explicación LookUp Match:",
          matchError,
        );

        if (!cancelled) {
          setMatchResult(null);
        }
      } finally {
        if (!cancelled) {
          setMatchLoading(false);
        }
      }
    }

    void loadMatchExplanation();

    return () => {
      cancelled =
        true;
    };
  }, [
    fromSettings,
    id,
    profile,
    session?.access_token,
    user?.id,
  ]);

  useEffect(() => {
    if (!photoOpen) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event:
        KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setPhotoOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    photoOpen,
  ]);

  const visibleLinks =
    useMemo(() => {
      if (!profile) {
        return links;
      }

      if (
        profile.account_type !==
          "business" ||
        !profile.business_website
          ?.trim()
      ) {
        return links;
      }

      const website =
        normalizeComparableUrl(
          profile.business_website,
        );

      return links.filter(
        (link) => {
          if (
            normalizeSocialPlatform(
              link.platform,
            ) !==
            "website"
          ) {
            return true;
          }

          return (
            normalizeComparableUrl(
              link.url,
            ) !== website
          );
        },
      );
    }, [
      links,
      profile,
    ]);

  if (loading) {
    return (
      <ProfileSkeleton />
    );
  }

  if (
    error ||
    !profile
  ) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6 sm:px-6">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
          <section className="w-full rounded-[32px] border border-[#ECEFF5] bg-white p-8 text-center shadow-sm">
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
              href={backHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5D5FEF] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4F51DC]"
            >
              <ArrowLeft
                size={16}
              />

              Volver a {backLabel}
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const isBusiness =
    profile.account_type ===
    "business";

  const displayName =
    profile.display_name
      .trim() ||
    (
      isBusiness
        ? "Negocio LookUp"
        : "Usuario LookUp"
    );

  const profession =
    profile.profession
      ?.trim();

  const bio =
    profile.bio
      ?.trim();

  const interests =
    Array.isArray(
      profile.interests,
    )
      ? profile.interests.filter(
          (interest) =>
            typeof interest ===
              "string" &&
            interest
              .trim()
              .length >
              0,
        )
      : [];

  const businessSector =
    profile.business_sector
      ?.trim();

  const businessCity =
    profile.business_city
      ?.trim();

  const businessProvince =
    profile.business_province
      ?.trim();

  const businessWebsite =
    profile.business_website
      ?.trim();

  const businessWebsiteHref =
    businessWebsite
      ? normalizeWebsiteUrl(
          businessWebsite,
        )
      : null;

  const personCity =
    profile.city
      ?.trim();

  const businessLocation =
    [
      businessCity,

      businessProvince &&
      businessProvince
        .toLowerCase() !==
        businessCity
          ?.toLowerCase()
        ? businessProvince
        : null,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <>
      <main className="min-h-screen bg-[#F7F8FC] px-3 py-3 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-2xl">
          <section className="overflow-hidden rounded-[36px] border border-[#E7EAF2] bg-white shadow-[0_18px_60px_rgba(36,43,82,0.08)]">
            <div className="relative h-56 overflow-hidden sm:h-64">
              {profile.avatar_url ? (
                <>
                  <Image
                    src={
                      profile.avatar_url
                    }
                    alt=""
                    fill
                    sizes="672px"
                    className="scale-125 object-cover opacity-45 blur-3xl"
                    priority
                  />

                  <div className="absolute inset-0 bg-gradient-to-b from-[#3432A8]/25 via-[#5D5FEF]/10 to-white" />

                  <div className="absolute inset-0 bg-white/15 backdrop-blur-[2px]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#5D5FEF] via-[#7774FF] to-[#E9E8FF]" />

                  <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />

                  <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#25228E]/20 blur-3xl" />
                </>
              )}

              <Link
                href={backHref}
                className="
                  absolute
                  left-4
                  top-4
                  z-20
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/50
                  bg-white/80
                  px-3.5
                  py-2
                  text-xs
                  font-black
                  text-slate-700
                  shadow-sm
                  backdrop-blur-xl
                  transition-all
                  hover:-translate-x-0.5
                  hover:bg-white
                  hover:text-[#5D5FEF]
                  sm:left-6
                  sm:top-6
                "
              >
                <ArrowLeft
                  size={14}
                />

                {backLabel}
              </Link>

              <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-[#5D5FEF] shadow-sm backdrop-blur-xl">
                  {isBusiness ? (
                    <Building2
                      size={12}
                    />
                  ) : (
                    <UserRound
                      size={12}
                    />
                  )}

                  {isBusiness
                    ? "Negocio local"
                    : "Persona"}
                </span>
              </div>
            </div>

            <div className="relative px-5 pb-8 sm:px-8 sm:pb-10">
              <div className="-mt-[74px] flex justify-center">
                {profile.avatar_url ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoOpen(
                        true,
                      )
                    }
                    aria-label={`Ampliar imagen de ${displayName}`}
                    className={[
                      "group relative h-[148px] w-[148px] overflow-hidden",
                      "border-[5px] border-white bg-[#EEF2FF]",
                      "shadow-[0_16px_40px_rgba(45,48,120,0.20)]",
                      "transition-transform duration-300 hover:scale-[1.025]",
                      isBusiness
                        ? "rounded-[36px]"
                        : "rounded-full",
                    ].join(" ")}
                  >
                    <Image
                      src={
                        profile.avatar_url
                      }
                      alt={
                        isBusiness
                          ? `Imagen de ${displayName}`
                          : `Foto de ${displayName}`
                      }
                      fill
                      sizes="148px"
                      className="object-cover"
                      priority
                    />

                    <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <Maximize2
                        size={14}
                      />
                    </span>
                  </button>
                ) : (
                  <div
                    className={[
                      "flex h-[148px] w-[148px] items-center justify-center",
                      "border-[5px] border-white bg-[#EEF2FF]",
                      "text-4xl font-black text-[#5D5FEF]",
                      "shadow-[0_16px_40px_rgba(45,48,120,0.20)]",
                      isBusiness
                        ? "rounded-[36px]"
                        : "rounded-full",
                    ].join(" ")}
                  >
                    {getInitials(
                      displayName,
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <h1 className="break-words text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                  {displayName}
                </h1>

                {profile.username ? (
                  <p className="mt-1.5 text-sm font-bold text-slate-400">
                    @{profile.username}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {isBusiness ? (
                    <>
                      {businessSector ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F2FF] px-3.5 py-2 text-xs font-black text-[#5D5FEF]">
                          <BriefcaseBusiness
                            size={13}
                          />

                          {businessSector}
                        </span>
                      ) : null}

                      {businessLocation ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600">
                          <MapPin
                            size={13}
                          />

                          {businessLocation}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {profession ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F2FF] px-3.5 py-2 text-xs font-black text-[#5D5FEF]">
                          <BriefcaseBusiness
                            size={13}
                          />

                          {profession}
                        </span>
                      ) : null}

                      {personCity ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600">
                          <MapPin
                            size={13}
                          />

                          {personCity}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {!fromSettings &&
              user?.id !== id &&
              matchLoading ? (
                <section className="mt-8 rounded-[26px] border border-[#E5E6F7] bg-[#FAFAFF] p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#EEEEFF] text-[#5D5FEF]">
                      <Sparkles
                        size={18}
                        className="animate-pulse"
                      />
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#5D5FEF]">
                        LOOKUP AI
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-800">
                        Entendiendo esta conexión...
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {matchResult ? (
                <MatchExplanation
                  result={
                    matchResult
                  }
                  isBusiness={
                    isBusiness
                  }
                />
              ) : null}

              {isBusiness &&
              businessWebsite &&
              businessWebsiteHref ? (
                <a
                  href={
                    businessWebsiteHref
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group
                    mt-7
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-4
                    rounded-[22px]
                    bg-gradient-to-r
                    from-[#5654F5]
                    to-[#6D69FF]
                    px-4
                    py-4
                    text-white
                    shadow-[0_14px_30px_rgba(93,95,239,0.22)]
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-[0_18px_38px_rgba(93,95,239,0.28)]
                  "
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                      <Globe2
                        size={18}
                      />
                    </span>

                    <span className="min-w-0 text-left">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">
                        Sitio web
                      </span>

                      <span className="mt-0.5 block truncate text-sm font-black">
                        {businessWebsite}
                      </span>
                    </span>
                  </span>

                  <ExternalLink
                    size={16}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              ) : null}

              {bio ? (
                <section className="mt-9">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                    {isBusiness
                      ? "SOBRE EL NEGOCIO"
                      : "SOBRE MÍ"}
                  </p>

                  <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-600 sm:text-base">
                    {bio}
                  </p>
                </section>
              ) : null}

              {interests.length >
              0 ? (
                <section className="mt-9">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-[#5D5FEF]"
                    />

                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                      {isBusiness
                        ? "TEMAS Y CATEGORÍAS"
                        : "INTERESES"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {interests.map(
                      (
                        interest,
                      ) => (
                        <span
                          key={
                            interest
                          }
                          className="rounded-full border border-[#E2E5FF] bg-[#F7F7FF] px-3.5 py-2 text-xs font-black text-[#5D5FEF]"
                        >
                          {interest}
                        </span>
                      ),
                    )}
                  </div>
                </section>
              ) : null}

              <SocialLinks
                links={
                  visibleLinks
                }
              />

              <section className="relative mt-9 overflow-hidden rounded-[26px] bg-[#12142A] p-5 text-white sm:p-6">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#5D5FEF]/35 blur-3xl" />

                <div className="absolute -bottom-20 left-16 h-40 w-40 rounded-full bg-[#8F8CFF]/15 blur-3xl" />

                <div className="relative flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#A9A7FF]">
                    <Sparkles
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9E9CFF]">
                      LOOKUP DISCOVERY
                    </p>

                    <h2 className="mt-2 text-lg font-black tracking-tight text-white">
                      {isBusiness
                        ? "Tu entorno también puede descubrirte."
                        : "Tu entorno también es una red."}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {isBusiness
                        ? "LookUp hace visible lo que haces a personas que ya están cerca, para que puedan descubrir tu negocio y continuar la conexión en tus canales."
                        : "LookUp convierte la proximidad real en una oportunidad para descubrir personas, conocer lo que hacen y continuar la conexión también en sus redes."}
                    </p>
                  </div>
                </div>
              </section>

              {!bio &&
              interests.length ===
                0 &&
              visibleLinks.length ===
                0 &&
              !businessWebsite ? (
                <section className="mt-8 rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-500">
                    {isBusiness
                      ? "Este negocio todavía no ha añadido más información pública."
                      : "Esta persona todavía no ha añadido más información pública."}
                  </p>
                </section>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      {photoOpen &&
      profile.avatar_url ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${displayName}`}
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/40
            p-5
            backdrop-blur-md
          "
          onMouseDown={() =>
            setPhotoOpen(
              false,
            )
          }
        >
          <div
            className="
              relative
              w-full
              max-w-[430px]
              overflow-hidden
              rounded-[32px]
              border
              border-white/25
              bg-white/90
              p-3
              shadow-[0_30px_90px_rgba(5,8,25,0.35)]
              backdrop-blur-2xl
            "
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-[25px] bg-slate-100">
              <Image
                src={
                  profile.avatar_url
                }
                alt={
                  isBusiness
                    ? `Imagen ampliada de ${displayName}`
                    : `Foto ampliada de ${displayName}`
                }
                fill
                sizes="430px"
                className="object-contain"
                priority
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {displayName}
                </p>

                {profile.username ? (
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                    @{profile.username}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPhotoOpen(
                    false,
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Cerrar imagen"
              >
                <X
                  size={17}
                />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}