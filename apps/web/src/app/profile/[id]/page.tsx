"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import {
  getProfileById,
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
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage({
  params,
}: Props) {
  const { id } = use(params);

  const [profile, setProfile] =
    useState<ProfileRow | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data } =
        await getProfileById(id);

      setProfile(data);
      setLoading(false);
    }

    void loadProfile();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Cargando perfil...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Perfil no encontrado.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-md">

        <Link
          href="/dashboard"
          className="text-sm font-bold text-[#5D5FEF]"
        >
          ← Volver
        </Link>

        <div className="mt-8 rounded-[2rem] bg-white p-8 shadow-sm">

          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#5D5FEF] text-3xl font-black text-white">

            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? ""}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              getInitials(
                profile.full_name ??
                  "LookUp"
              )
            )}
          </div>

          <h1 className="mt-6 text-center text-3xl font-black">
            {profile.full_name}
          </h1>

          <p className="mt-2 text-center text-[#5D5FEF] font-bold">
            {profile.profession ??
              "Profesión no indicada"}
          </p>

          <p className="mt-1 text-center text-slate-500">
            📍 {profile.city ?? "Sin ciudad"}
          </p>

          <div className="mt-8 rounded-xl bg-slate-50 p-5">
            <p className="text-sm leading-6 text-slate-600">
              {profile.bio ??
                "Este usuario todavía no ha escrito una biografía."}
            </p>
          </div>

          <div className="mt-8 space-y-3">

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-black uppercase">
                Instagram
              </p>

              <p className="mt-1 text-sm">
                {profile.instagram ??
                  "No añadido"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-black uppercase">
                Twitter / X
              </p>

              <p className="mt-1 text-sm">
                {profile.twitter ??
                  "No añadido"}
              </p>
            </div>

          </div>

          <button
            className="mt-8 w-full rounded-xl bg-[#5D5FEF] py-4 font-black text-white"
          >
            Conectar
          </button>

        </div>
      </div>
    </main>
  );
}