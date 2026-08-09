"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Globe2,
  Link2,
  MapPin,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import {
  getProfileById,
  getProfileLinks,
  type ProfileLink,
  type ProfileRow,
} from "@lookup/services";

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

function getPlatformLabel(platform: string) {
  const normalized = platform.trim().toLowerCase();

  const labels: Record<string, string> = {
    instagram: "Instagram",
    twitter: "X",
    x: "X",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    github: "GitHub",
    website: "Web",
    web: "Web",
  };

  return labels[normalized] ?? platform;
}

function getPlatformInitial(platform: string) {
  const normalized = platform.trim().toLowerCase();

  const initials: Record<string, string> = {
    instagram: "IG",
    twitter: "X",
    x: "X",
    linkedin: "in",
    facebook: "f",
    tiktok: "TT",
    youtube: "YT",
    github: "GH",
    website: "↗",
    web: "↗",
  };

  return initials[normalized] ?? "↗";
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

export default function ProfilePage({
  params,
}: Props) {
  const { id } = use(params);

  const [profile, setProfile] =
    useState<ProfileRow | null>(null);

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
          profileResult,
          linksResult,
        ] = await Promise.all([
          getProfileById(id),
          getProfileLinks(id),
        ]);

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (cancelled) {
          return;
        }

        setProfile(
          profileResult.data,
        );

        setLinks(
          (linksResult ?? []).filter(
            (link) =>
              link.is_public &&
              link.url.trim(),
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="h-10 w-24 animate-pulse rounded-full bg-white" />

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#ECEFF5] bg-white shadow-sm">
            <div className="h-32 animate-pulse bg-[#EEF2FF]" />

            <div className="px-5 pb-8 sm:px-8">
              <div className="-mt-14 h-28 w-28 animate-pulse rounded-full border-4 border-white bg-slate-200" />

              <div className="mt-5 h-7 w-48 animate-pulse rounded bg-slate-200" />

              <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-100" />

              <div className="mt-8 h-24 animate-pulse rounded-2xl bg-slate-50" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-6">
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
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5D5FEF] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4F51DC]"
            >
              <ArrowLeft size={16} />
              Volver al radar
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const fullName =
    profile.full_name?.trim() ||
    profile.username?.trim() ||
    "Usuario LookUp";

  const profession =
    profile.profession?.trim();

  const city =
    profile.city?.trim();

  const bio =
    profile.bio?.trim();

  const interests =
    Array.isArray(profile.interests)
      ? profile.interests.filter(
        (interest) =>
          typeof interest === "string" &&
          interest.trim(),
      )
      : [];

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:text-[#5D5FEF]"
        >
          <ArrowLeft size={16} />
          Volver al radar
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#ECEFF5] bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-br from-[#EEF2FF] via-white to-[#F5F3FF] sm:h-36" />

          <div className="px-5 pb-7 sm:px-8 sm:pb-9">
            <div className="-mt-14 flex items-end justify-between sm:-mt-16">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#EEF2FF] shadow-md sm:h-32 sm:w-32">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={`Foto de ${fullName}`}
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-[#5D5FEF]">
                    {getInitials(fullName)}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {fullName}
              </h1>

              {profile.username && (
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  @{profile.username}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {profession && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-3 py-1.5 text-xs font-bold text-[#5D5FEF]">
                    <BriefcaseBusiness size={13} />
                    {profession}
                  </span>
                )}

                {city && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    <MapPin size={13} />
                    {city}
                  </span>
                )}
              </div>
            </div>

            {bio && (
              <section className="mt-7">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  SOBRE MÍ
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                  {bio}
                </p>
              </section>
            )}

            {interests.length > 0 && (
              <section className="mt-7">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  INTERESES
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map(
                    (interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-[#E5E7FF] bg-[#F5F5FF] px-3.5 py-2 text-xs font-bold text-[#5D5FEF]"
                      >
                        {interest}
                      </span>
                    ),
                  )}
                </div>
              </section>
            )}

            {links.length > 0 && (
              <section className="mt-7">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    REDES Y ENLACES
                  </p>

                  <Globe2
                    size={15}
                    className="text-slate-300"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={normalizeExternalUrl(
                        link.url,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#ECEFF5] bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-[#DCDFFF] hover:bg-[#FAFAFF]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-xs font-black text-[#5D5FEF]">
                        {getPlatformInitial(
                          link.platform,
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-slate-800">
                          {getPlatformLabel(
                            link.platform,
                          )}
                        </span>

                        <span className="mt-0.5 block truncate text-xs text-slate-400">
                          {link.url}
                        </span>
                      </span>

                      <Link2
                        size={15}
                        className="shrink-0 text-slate-300 transition group-hover:text-[#5D5FEF]"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {!bio &&
              interests.length === 0 &&
              links.length === 0 && (
                <section className="mt-7 rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-500">
                    Este perfil todavía no ha añadido más información pública.
                  </p>
                </section>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}