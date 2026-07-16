"use client";

import Image from "next/image";
import type {
  ProfileLink,
  ProfileRow,
} from "@lookup/services";

type SettingsViewProps = {
  profile: ProfileRow;
  links: ProfileLink[];
  profileVisible: boolean;
  onToggleVisibility: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SettingsView({
  profile,
  links,
  profileVisible,
  onToggleVisibility,
  onEditProfile,
  onLogout,
}: SettingsViewProps) {
  const name =
    profile.full_name ??
    profile.username ??
    "Usuario";

  return (
    <section className="space-y-5">

      <div className="rounded-[2rem] bg-white p-6 shadow-sm">

        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-[#5D5FEF]">

          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-black">
              {getInitials(name)}
            </div>
          )}

        </div>

        <h2 className="mt-4 text-center text-2xl font-black">
          {name}
        </h2>

        <p className="text-center text-[#5D5FEF]">
          @{profile.username ?? "usuario"}
        </p>

      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm">

        <h3 className="text-lg font-black">
          Redes sociales
        </h3>

        <div className="mt-4 space-y-3">

          {links.length === 0 ? (
            <p className="text-sm text-slate-500">
              No has añadido redes.
            </p>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <p className="font-bold">
                  {link.platform}
                </p>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-[#5D5FEF]"
                >
                  {link.url}
                </a>
              </div>
            ))
          )}

        </div>

      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm space-y-3">

        <button
          onClick={onToggleVisibility}
          className="w-full rounded-xl bg-[#5D5FEF] py-3 font-bold text-white"
        >
          {profileVisible
            ? "Ocultar perfil"
            : "Mostrar perfil"}
        </button>

        <button
          onClick={onEditProfile}
          className="w-full rounded-xl border py-3 font-bold"
        >
          Editar perfil
        </button>

        <button
          onClick={onLogout}
          className="w-full rounded-xl border border-red-300 py-3 font-bold text-red-600"
        >
          Cerrar sesión
        </button>

      </div>

    </section>
  );
}