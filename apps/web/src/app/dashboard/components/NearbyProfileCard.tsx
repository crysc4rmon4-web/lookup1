"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowUpRight,
  AtSign,
  Building2,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import type { NearbyProfile } from "@lookup/types";

type Props = {
  profile: NearbyProfile;
};

function getMatchLabel(score: number) {
  if (score >= 85) {
    return "Afinidad muy alta";
  }

  if (score >= 70) {
    return "Alta afinidad";
  }

  if (score >= 55) {
    return "Buena afinidad";
  }

  if (score >= 40) {
    return "Afinidad moderada";
  }

  return "Afinidad inicial";
}

function formatInterest(value: string) {
  const normalized = value.trim();

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

export function NearbyProfileCard({
  profile,
}: Props) {
  const isBusiness =
    profile.account_type === "business";

  const displayName =
    profile.full_name ??
    (isBusiness
      ? "Negocio local"
      : "Usuario");

  const rawMatchScore =
    profile.match_score;

  const matchScore =
    typeof rawMatchScore === "number"
      ? Math.max(
          0,
          Math.min(
            100,
            rawMatchScore,
          ),
        )
      : null;

  const sharedInterests =
    Array.isArray(profile.shared_interests)
      ? profile.shared_interests
          .map(formatInterest)
          .filter(Boolean)
      : [];

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="
        group
        relative
        block
        overflow-hidden
        rounded-[30px]
        border
        border-[#E8EBF3]
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(30,41,59,0.045)]
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-[#5D5FEF]/25
        hover:shadow-[0_18px_45px_rgba(30,41,59,0.075)]
      "
    >
      <div className="flex gap-4">
        <div
          className={[
            "relative h-[68px] w-[68px] shrink-0 overflow-hidden border-[3px] border-[#F0F2FF] bg-[#F0F2FF]",
            isBusiness
              ? "rounded-[21px]"
              : "rounded-full",
          ].join(" ")}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              fill
              sizes="68px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#5D5FEF]">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-black tracking-tight text-slate-950">
                {displayName}
              </h3>

              <p className="mt-0.5 truncate text-sm font-bold text-[#5D5FEF]">
                {profile.profession ??
                  (isBusiness
                    ? "Negocio local"
                    : "Profesional")}
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F7F8FB] px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
              <MapPin size={11} />

              {Math.round(profile.distance)} m
            </span>
          </div>

          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#5D5FEF]">
              {isBusiness ? (
                <Building2 size={10} />
              ) : (
                <UserRound size={10} />
              )}

              {isBusiness
                ? "Negocio"
                : "Persona"}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
        {profile.bio ??
          (isBusiness
            ? "Sin descripción del negocio."
            : "Sin biografía.")}
      </p>

      {matchScore !== null ? (
        <div className="mt-4 rounded-[20px] border border-[#E4E5FA] bg-gradient-to-br from-[#FAFAFF] via-white to-[#F7F5FF] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#5D5FEF] text-white shadow-[0_7px_18px_rgba(93,95,239,0.20)]">
              <Sparkles
                size={15}
                strokeWidth={2.2}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[0.21em] text-[#5D5FEF]">
                LOOKUP MATCH
              </p>

              <p className="mt-0.5 text-[13px] font-black text-slate-900">
                {getMatchLabel(matchScore)}
              </p>
            </div>

            <div className="shrink-0">
              <span className="text-[22px] font-black tracking-tight text-[#5D5FEF]">
                {matchScore}
              </span>

              <span className="ml-0.5 text-xs font-black text-[#5D5FEF]">
                %
              </span>
            </div>
          </div>

          {sharedInterests.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {sharedInterests
                .slice(0, 3)
                .map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-[#E8E9F5] bg-white px-2.5 py-1 text-[9px] font-bold text-slate-600"
                  >
                    {interest}
                  </span>
                ))}

              {sharedInterests.length > 3 ? (
                <span className="rounded-full bg-[#EEEEFF] px-2.5 py-1 text-[9px] font-black text-[#5D5FEF]">
                  +
                  {sharedInterests.length -
                    3}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2.5 text-[10px] font-medium leading-4 text-slate-400">
              Afinidad detectada a partir del
              contexto semántico de ambos perfiles.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-[#E6E8F0] bg-[#FAFBFC] px-4 py-3">
          <p className="text-[10px] font-semibold leading-5 text-slate-400">
            LookUp está preparando la afinidad
            inteligente de este perfil.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[#F0F2F6] pt-3.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <AtSign
            size={12}
            className="shrink-0 text-slate-400"
          />

          <span className="truncate text-[10px] font-bold tracking-wide text-slate-400">
            {profile.username ??
              "usuario"}
          </span>
        </div>

        <span
          className={[
            "inline-flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-[0.13em] transition",
            matchScore !== null
              ? "text-[#5D5FEF] group-hover:gap-1.5"
              : "text-slate-300",
          ].join(" ")}
        >
          {matchScore !== null
            ? "Ver por qué"
            : "Ver perfil"}

          <ArrowUpRight size={11} />
        </span>
      </div>
    </Link>
  );
}