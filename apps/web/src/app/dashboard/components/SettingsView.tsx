"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  CircleHelp,
  Eye,
  FileText,
  LogOut,
  Pencil,
  Radar,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import type {
  ProfileLink,
  ProfileRow,
  RadarBlockedZone,
} from "@lookup/services";

import {
  SocialIcon,
} from "@/components/ui/SocialIcon";

import {
  buildSocialProfileUrl,
  getSocialPlatformLabel,
  normalizeSocialPlatform,
} from "@/lib/social-profile-url";

import {
  BlockedZonesSection,
} from "./BlockedZonesSection";

export type SettingsEditSection =
  | "profile"
  | "name"
  | "profession"
  | "bio"
  | "socials"
  | "interests";

type SettingsViewProps = {
  profile: ProfileRow;
  links: ProfileLink[];

  radarEnabled: boolean;
  radarPrivacyBlocked: boolean;
  radarToggleLoading: boolean;

  profileVisibilitySaving: boolean;

  onToggleRadar: () => void;
  onToggleProfileVisibility: () => void;

  blockedZones: RadarBlockedZone[];
  blockedZonesLoading: boolean;
  blockedZonesSaving: boolean;
  canAddBlockedZone: boolean;
  maxBlockedZones: number;

  onAddBlockedZone: () => void;

  onEditBlockedZone: (
    zone: RadarBlockedZone,
  ) => void;

  onDeleteBlockedZone: (
    zone: RadarBlockedZone,
  ) => void;

  onEditProfile: (
    section?: SettingsEditSection,
  ) => void;

  onDeleteAccount: () => void;

  onLogout: () => void;
};

function getInitials(
  name: string,
) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ??
        "",
    )
    .join("");
}

export function SettingsView({
  profile,
  links,

  radarEnabled,
  radarPrivacyBlocked,
  radarToggleLoading,

  profileVisibilitySaving,

  onToggleRadar,
  onToggleProfileVisibility,

  blockedZones,
  blockedZonesLoading,
  blockedZonesSaving,
  canAddBlockedZone,
  maxBlockedZones,

  onAddBlockedZone,
  onEditBlockedZone,
  onDeleteBlockedZone,

  onEditProfile,
  onDeleteAccount,
  onLogout,
}: SettingsViewProps) {
  const isBusiness =
    profile.account_type ===
    "business";

  const name =
    profile.full_name?.trim() ||
    profile.username?.trim() ||
    (
      isBusiness
        ? "Negocio LookUp"
        : "Usuario LookUp"
    );

  const username =
    profile.username?.trim();

  const profession =
    profile.profession?.trim();

  const socialLinks =
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
          id: link.id,
          platform,
          href,
        };
      })
      .filter(
        (
          item,
        ): item is {
          id: string;
          platform: string;
          href: string;
        } =>
          item !== null,
      );

  const radarTitle =
    radarPrivacyBlocked
      ? "Protegido"
      : radarEnabled
        ? "Activo"
        : "Inactivo";

  const radarDescription =
    radarPrivacyBlocked
      ? "Estás dentro de una zona privada. LookUp ha ocultado tu presencia automáticamente."
      : radarEnabled &&
          !profile.visibility
        ? "El Radar está encendido, pero tu perfil privado no se muestra a otras personas."
        : radarEnabled
          ? "Estás disponible para el descubrimiento de personas realmente cercanas."
          : "No estás apareciendo actualmente en el Radar.";

  return (
    <section className="space-y-7 pb-28">
      <section className="relative overflow-hidden rounded-[32px] border border-[#E8EAF6] bg-white shadow-[0_16px_45px_rgba(34,41,91,0.07)]">
        <div className="absolute inset-x-0 top-0 h-[108px] bg-gradient-to-r from-[#5D5FEF] via-[#686AF2] to-[#898AFF]" />

        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/20 blur-3xl" />

        <div className="relative px-5 pb-5 pt-6 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <div
              className={[
                "relative mt-7 h-24 w-24 overflow-hidden border-4 border-white bg-[#EEF2FF] shadow-[0_12px_30px_rgba(30,33,95,0.20)]",
                isBusiness
                  ? "rounded-[26px]"
                  : "rounded-full",
              ].join(" ")}
            >
              {profile.avatar_url ? (
                <Image
                  src={
                    profile.avatar_url
                  }
                  alt={name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#5D5FEF]">
                  {getInitials(
                    name,
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                {isBusiness ? (
                  <Building2
                    size={14}
                    className="text-[#5D5FEF]"
                  />
                ) : (
                  <UserRound
                    size={14}
                    className="text-[#5D5FEF]"
                  />
                )}

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5D5FEF]">
                  {isBusiness
                    ? "MI NEGOCIO"
                    : "MI PERFIL"}
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {name}
              </h1>

              {username ? (
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  @{username}
                </p>
              ) : null}

              {profession ? (
                <p className="mt-2 text-sm font-bold text-slate-600">
                  {profession}
                </p>
              ) : null}
            </div>
          </div>

          {socialLinks.length >
          0 ? (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {socialLinks
                .slice(0, 8)
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ${getSocialPlatformLabel(
                      link.platform,
                    )}`}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7E9F1] bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-[#CED1FF] hover:text-[#5D5FEF]"
                  >
                    <SocialIcon
                      platform={
                        link.platform
                      }
                      size={16}
                    />
                  </a>
                ))}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href={`/profile/${profile.id}?from=settings`}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-4 py-3 text-sm font-black text-white transition hover:bg-[#5153E6]"
            >
              <Eye size={15} />

              {isBusiness
                ? "Ver negocio"
                : "Ver mi perfil"}

              <ArrowUpRight
                size={13}
              />
            </Link>

            <button
              type="button"
              onClick={() =>
                onEditProfile(
                  "profile",
                )
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#E0E3EC] bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#CACDFC] hover:text-[#5D5FEF]"
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          PRIVACIDAD Y RADAR
        </p>

        <div className="overflow-hidden rounded-[28px] border border-[#E9ECF3] bg-white shadow-sm">
          <div className="flex items-center gap-4 px-5 py-5">
            <div
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                radarPrivacyBlocked
                  ? "bg-rose-50 text-rose-500"
                  : radarEnabled
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {radarPrivacyBlocked ? (
                <ShieldCheck size={20} />
              ) : (
                <Radar size={20} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">
                  Radar
                </h2>

                <span
                  className={[
                    "rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]",
                    radarPrivacyBlocked
                      ? "bg-rose-50 text-rose-500"
                      : radarEnabled
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {radarTitle}
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {radarDescription}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={
                radarEnabled
              }
              disabled={
                radarToggleLoading ||
                radarPrivacyBlocked
              }
              onClick={
                onToggleRadar
              }
              className={[
                "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60",
                radarPrivacyBlocked
                  ? "bg-rose-200"
                  : radarEnabled
                    ? "bg-[#5D5FEF]"
                    : "bg-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
                  radarEnabled
                    ? "left-6"
                    : "left-1",
                ].join(" ")}
              />
            </button>
          </div>

          <div className="flex items-center gap-4 border-t border-[#EEF0F5] px-5 py-5">
            <div
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                profile.visibility
                  ? "bg-[#EEF2FF] text-[#5D5FEF]"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              <Eye size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-slate-900">
                  Perfil
                </p>

                <span
                  className={[
                    "rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]",
                    profile.visibility
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {profile.visibility
                    ? "Público"
                    : "Privado"}
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {profile.visibility
                  ? "Tu perfil puede descubrirse y abrirse desde LookUp."
                  : "Has ocultado tu perfil. No puede descubrirse públicamente."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={
                profile.visibility
              }
              disabled={
                profileVisibilitySaving
              }
              onClick={
                onToggleProfileVisibility
              }
              aria-label={
                profile.visibility
                  ? "Cambiar perfil a privado"
                  : "Cambiar perfil a público"
              }
              className={[
                "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60",
                profile.visibility
                  ? "bg-[#5D5FEF]"
                  : "bg-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
                  profile.visibility
                    ? "left-6"
                    : "left-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </section>

      <BlockedZonesSection
        zones={blockedZones}
        loading={
          blockedZonesLoading
        }
        saving={
          blockedZonesSaving
        }
        canAddZone={
          canAddBlockedZone
        }
        maxZones={
          maxBlockedZones
        }
        onAdd={
          onAddBlockedZone
        }
        onEdit={
          onEditBlockedZone
        }
        onDelete={
          onDeleteBlockedZone
        }
      />

      <section>
        <p className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          CUENTA Y SOPORTE
        </p>

        <div className="overflow-hidden rounded-[28px] border border-[#E9ECF3] bg-white shadow-sm">
          <nav className="divide-y divide-[#EEF0F5]">
            <Link
              href="/legal/terms?from=settings"
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FileText size={18} />
              </div>

              <span className="flex-1 text-sm font-bold text-slate-700">
                Términos y condiciones
              </span>

              <ChevronRight
                size={17}
                className="text-slate-300"
              />
            </Link>

            <Link
              href="/legal/privacy?from=settings"
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ShieldCheck size={18} />
              </div>

              <span className="flex-1 text-sm font-bold text-slate-700">
                Privacidad
              </span>

              <ChevronRight
                size={17}
                className="text-slate-300"
              />
            </Link>

            <a
              href="mailto:ayudalookup@gmail.com?subject=Ayuda%20con%20LookUp"
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <CircleHelp size={18} />
              </div>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-700">
                  Ayuda
                </span>

                <span className="block truncate text-xs text-slate-400">
                  ayudalookup@gmail.com
                </span>
              </span>

              <ChevronRight
                size={17}
                className="text-slate-300"
              />
            </a>

            <button
              type="button"
              onClick={
                onLogout
              }
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-red-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <LogOut size={18} />
              </div>

              <span className="flex-1 text-sm font-black text-red-600">
                Cerrar sesión
              </span>

              <ChevronRight
                size={17}
                className="text-red-300"
              />
            </button>
          </nav>
        </div>
      </section>

      <section>
        <p className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
          ZONA DE RIESGO
        </p>

        <div
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-red-100
            bg-gradient-to-br
            from-white
            to-red-50/60
            shadow-sm
          "
        >
          <div className="flex items-start gap-4 px-5 py-5">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-red-50
                text-red-500
              "
            >
              <Trash2 size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-slate-900">
                Eliminar cuenta
              </h2>

              <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                Elimina permanentemente tu cuenta
                de LookUp y los datos personales
                asociados.
              </p>

              <button
                type="button"
                onClick={
                  onDeleteAccount
                }
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-red-200
                  bg-white
                  px-3.5
                  py-2.5
                  text-xs
                  font-black
                  text-red-500
                  shadow-sm
                  transition
                  hover:border-red-300
                  hover:bg-red-50
                "
              >
                <Trash2 size={13} />
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}