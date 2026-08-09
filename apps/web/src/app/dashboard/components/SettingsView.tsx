"use client";

import Image from "next/image";
import Link from "next/link";

import {
  CircleHelp,
  FileText,
  LogOut,
  MapPin,
  Pencil,
  Radar,
  ShieldCheck,
} from "lucide-react";

import type {
  ProfileLink,
  ProfileRow,
  RadarBlockedZone,
} from "@lookup/services";

import { BlockedZonesSection } from "./BlockedZonesSection";

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
  radarToggleLoading: boolean;
  onToggleRadar: () => void;

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

  /**
   * Abre la edición puntual desde Ajustes.
   *
   * Importante:
   * esto NO debe navegar al onboarding.
   */
  onEditProfile: (
    section?: SettingsEditSection,
  ) => void;

  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ?? "",
    )
    .join("");
}

function formatPlatform(platform: string) {
  return platform
    .replace(/[_-]/g, " ")
    .trim()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function EditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Editar ${label}`}
      title={`Editar ${label}`}
      className="
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-xl
        text-slate-400
        transition
        hover:bg-[#EEF2FF]
        hover:text-[#5D5FEF]
        active:scale-95
      "
    >
      <Pencil size={15} />
    </button>
  );
}

export function SettingsView({
  profile,
  links,
  radarEnabled,
  radarToggleLoading,
  onToggleRadar,
  blockedZones,
  blockedZonesLoading,
  blockedZonesSaving,
  canAddBlockedZone,
  maxBlockedZones,
  onAddBlockedZone,
  onEditBlockedZone,
  onDeleteBlockedZone,
  onEditProfile,
  onLogout,
}: SettingsViewProps) {
  const name =
    profile.full_name ??
    profile.username ??
    "Usuario";

  const city = profile.city?.trim();

  return (
    <section className="space-y-4 pb-28">
      {/* =========================================================
          PERFIL
          ========================================================= */}

      <section
        aria-labelledby="profile-heading"
        className="
          overflow-hidden
          rounded-[2rem]
          border
          border-[#ECEFF5]
          bg-white
          shadow-sm
        "
      >
        <div
          className="
            bg-gradient-to-br
            from-[#5D5FEF]
            via-[#686AF2]
            to-[#7C7EF7]
            px-6
            pb-7
            pt-8
          "
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="
                relative
                h-24
                w-24
                overflow-hidden
                rounded-full
                border-4
                border-white/90
                bg-white/20
                shadow-lg
              "
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`Foto de perfil de ${name}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    text-2xl
                    font-black
                    text-white
                  "
                >
                  {getInitials(name)}
                </div>
              )}
            </div>

            <h2
              id="profile-heading"
              className="
                mt-4
                text-2xl
                font-black
                tracking-tight
                text-white
              "
            >
              {name}
            </h2>

            {profile.username && (
              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-white/75
                "
              >
                @{profile.username}
              </p>
            )}

            {profile.profession && (
              <p
                className="
                  mt-3
                  text-sm
                  font-bold
                  text-white
                "
              >
                {profile.profession}
              </p>
            )}

            {city && (
              <div
                className="
                  mt-2
                  flex
                  items-center
                  gap-1.5
                  text-xs
                  font-semibold
                  text-white/75
                "
              >
                <MapPin size={13} />
                <span>{city}</span>
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Nombre */}
          <div
            className="
              flex
              items-center
              gap-3
              px-5
              py-4
            "
          >
            <div className="min-w-0 flex-1">
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-slate-400
                "
              >
                Nombre
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-sm
                  font-bold
                  text-slate-800
                "
              >
                {profile.full_name || "Sin nombre"}
              </p>
            </div>

            <EditButton
              label="nombre"
              onClick={() =>
                onEditProfile("name")
              }
            />
          </div>

          {/* Profesión */}
          <div
            className="
              flex
              items-center
              gap-3
              px-5
              py-4
            "
          >
            <div className="min-w-0 flex-1">
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-slate-400
                "
              >
                Profesión
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-sm
                  font-bold
                  text-slate-800
                "
              >
                {profile.profession ||
                  "Sin profesión"}
              </p>
            </div>

            <EditButton
              label="profesión"
              onClick={() =>
                onEditProfile(
                  "profession",
                )
              }
            />
          </div>

          {/* Biografía */}
          <div
            className="
              flex
              items-start
              gap-3
              px-5
              py-4
            "
          >
            <div className="min-w-0 flex-1">
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-slate-400
                "
              >
                Biografía
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-5
                  text-slate-600
                "
              >
                {profile.bio ||
                  "Todavía no has añadido una biografía."}
              </p>
            </div>

            <EditButton
              label="biografía"
              onClick={() =>
                onEditProfile("bio")
              }
            />
          </div>

          {/* Botón de edición general */}
          <div className="p-5">
            <button
              type="button"
              onClick={() =>
                onEditProfile("profile")
              }
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-4
                py-3.5
                text-sm
                font-black
                text-slate-800
                transition
                hover:border-[#5D5FEF]/30
                hover:bg-[#F8F8FF]
                active:scale-[0.99]
              "
            >
              <Pencil size={16} />
              Editar perfil
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          RADAR
          ========================================================= */}

      <section
        aria-labelledby="radar-settings-heading"
        className="
          rounded-[2rem]
          border
          border-[#ECEFF5]
          bg-white
          p-5
          shadow-sm
        "
      >
        <div className="flex items-start gap-4">
          <div
            className={`
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              ${radarEnabled
                ? "bg-[#EEF2FF] text-[#5D5FEF]"
                : "bg-slate-100 text-slate-500"
              }
            `}
          >
            <Radar size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="radar-settings-heading"
              className="
                text-base
                font-black
                text-slate-900
              "
            >
              Radar
            </h2>

            <p
              className="
                mt-1
                text-sm
                leading-5
                text-slate-500
              "
            >
              {radarEnabled
                ? "Estás visible para personas cercanas."
                : "Tu radar está desactivado y no apareces a otras personas."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={radarEnabled}
            aria-label={
              radarEnabled
                ? "Desactivar radar"
                : "Activar radar"
            }
            disabled={radarToggleLoading}
            onClick={onToggleRadar}
            className={`
              relative
              h-7
              w-12
              shrink-0
              rounded-full
              transition
              duration-200
              disabled:cursor-not-allowed
              disabled:opacity-60
              ${radarEnabled
                ? "bg-[#5D5FEF]"
                : "bg-slate-300"
              }
            `}
          >
            <span
              className={`
                absolute
                top-1
                h-5
                w-5
                rounded-full
                bg-white
                shadow-sm
                transition
                duration-200
                ${radarEnabled
                  ? "left-6"
                  : "left-1"
                }
              `}
            />
          </button>
        </div>
      </section>

      {/* =========================================================
          REDES SOCIALES
          ========================================================= */}

      <section
        aria-labelledby="social-heading"
        className="
          rounded-[2rem]
          border
          border-[#ECEFF5]
          bg-white
          p-5
          shadow-sm
        "
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="social-heading"
              className="
                text-base
                font-black
                text-slate-900
              "
            >
              Redes sociales
            </h2>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-500
              "
            >
              Las personas pueden usarlas para
              conectar contigo.
            </p>
          </div>

          <EditButton
            label="redes sociales"
            onClick={() =>
              onEditProfile("socials")
            }
          />
        </div>

        {links.length === 0 ? (
          <div
            className="
              mt-4
              rounded-2xl
              bg-slate-50
              px-4
              py-4
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-slate-600
              "
            >
              No has añadido redes sociales.
            </p>

            <button
              type="button"
              onClick={() =>
                onEditProfile("socials")
              }
              className="
                mt-2
                text-sm
                font-black
                text-[#5D5FEF]
              "
            >
              Añadir redes →
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-slate-200
                  px-4
                  py-3.5
                  transition
                  hover:border-[#5D5FEF]/30
                  hover:bg-[#F8F8FF]
                "
              >
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
                  <span
                    className="
                      text-xs
                      font-black
                    "
                  >
                    {formatPlatform(
                      link.platform,
                    ).slice(0, 1)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      text-sm
                      font-black
                      text-slate-800
                    "
                  >
                    {formatPlatform(
                      link.platform,
                    )}
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-xs
                      text-slate-500
                    "
                  >
                    {link.url}
                  </p>
                </div>

                <span
                  className="
                    shrink-0
                    text-xs
                    font-black
                    text-slate-300
                  "
                  aria-hidden="true"
                >
                  ↗
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================
          ZONAS BLOQUEADAS
          ========================================================= */}

      <BlockedZonesSection
        zones={blockedZones}
        loading={blockedZonesLoading}
        saving={blockedZonesSaving}
        canAddZone={canAddBlockedZone}
        maxZones={maxBlockedZones}
        onAdd={onAddBlockedZone}
        onEdit={onEditBlockedZone}
        onDelete={onDeleteBlockedZone}
      />

      {/* =========================================================
          CUENTA
          ========================================================= */}

      <section
        aria-labelledby="account-heading"
        className="
          overflow-hidden
          rounded-[2rem]
          border
          border-[#ECEFF5]
          bg-white
          shadow-sm
        "
      >
        <div className="px-5 pb-2 pt-5">
          <h2
            id="account-heading"
            className="
              text-base
              font-black
              text-slate-900
            "
          >
            Cuenta
          </h2>
        </div>

        <nav aria-label="Opciones de cuenta">
          <Link
            href="/legal/terms"
            className="
              flex
              items-center
              gap-4
              border-t
              border-slate-100
              px-5
              py-4
              transition
              hover:bg-slate-50
            "
          >
            <FileText
              size={18}
              className="
                shrink-0
                text-slate-500
              "
            />

            <span
              className="
                flex-1
                text-sm
                font-bold
                text-slate-700
              "
            >
              Términos y condiciones
            </span>

            <span className="text-slate-300">
              ›
            </span>
          </Link>

          <Link
            href="/legal/privacy"
            className="
              flex
              items-center
              gap-4
              border-t
              border-slate-100
              px-5
              py-4
              transition
              hover:bg-slate-50
            "
          >
            <ShieldCheck
              size={18}
              className="
                shrink-0
                text-slate-500
              "
            />

            <span
              className="
                flex-1
                text-sm
                font-bold
                text-slate-700
              "
            >
              Privacidad
            </span>

            <span className="text-slate-300">
              ›
            </span>
          </Link>

          <a
            href="mailto:ayudalookup@gmail.com?subject=Ayuda%20con%20LookUp"
            className="
              flex
              items-center
              gap-4
              border-t
              border-slate-100
              px-5
              py-4
              transition
              hover:bg-slate-50
            "
          >
            <CircleHelp
              size={18}
              className="
                shrink-0
                text-slate-500
              "
            />

            <span className="min-w-0 flex-1">
              <span
                className="
                  block
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                Ayuda
              </span>

              <span
                className="
                  mt-0.5
                  block
                  truncate
                  text-xs
                  text-slate-400
                "
              >
                ayudalookup@gmail.com
              </span>
            </span>

            <span className="text-slate-300">
              ›
            </span>
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="
              flex
              w-full
              items-center
              gap-4
              border-t
              border-slate-100
              px-5
              py-4
              text-left
              transition
              hover:bg-red-50
            "
          >
            <LogOut
              size={18}
              className="
                shrink-0
                text-red-500
              "
            />

            <span
              className="
                flex-1
                text-sm
                font-bold
                text-red-600
              "
            >
              Cerrar sesión
            </span>

            <span className="text-red-300">
              ›
            </span>
          </button>
        </nav>
      </section>
    </section>
  );
}