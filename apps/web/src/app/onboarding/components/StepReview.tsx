"use client";

import Image from "next/image";

import { INTEREST_OPTIONS } from "@lookup/config";

import { Camera, Globe } from "lucide-react";

type Social = {
  platform: string;
  url: string;
};

type Props = {
  avatarUrl: string;

  fullName: string;

  username: string;

  profession: string;

  bio: string;

  interests: string[];

  socialLinks: Social[];
};

export function StepReview({
  avatarUrl,
  fullName,
  username,
  profession,
  bio,
  interests,
  socialLinks,
}: Props) {
  const hasSocials = socialLinks.length > 0;

  const hasInterests = interests.length > 0;

  function getInterestLabel(id: string) {
    return INTEREST_OPTIONS.find((interest) => interest.id === id)?.label ?? id;
  }

  return (
    <section className="flex min-h-[560px] flex-col">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
          PERFIL
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight text-[#111827]">
          Revisa tu perfil
        </h2>

        <p className="mt-4 text-base leading-7 text-slate-500">
          Comprueba que toda la información es correcta antes de entrar en
          LookUp.
        </p>
      </div>

      <div className="mt-10 rounded-[32px] border border-[#E7E7EF] bg-white p-7 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-[#5D5FEF] bg-slate-100">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <Camera size={38} />
              </div>
            )}
          </div>

          <h3 className="mt-6 text-2xl font-black text-slate-900">
            {fullName || "Tu nombre"}
          </h3>

          {profession && (
            <p className="mt-2 text-base font-medium text-slate-500">
              {profession}
            </p>
          )}

          <p className="mt-2 text-sm font-medium text-[#5D5FEF]">
            @
            {username
              ? username
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9\s]/g, "")
                  .replace(/\s+/g, "-")
              : "usuario"}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Biografía
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {bio || "Sin descripción."}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Redes sociales
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {hasSocials ? (
                socialLinks.map((social) => (
                  <span
                    key={social.platform}
                    className="rounded-full bg-[#EEF0FF] px-4 py-2 text-xs font-semibold text-[#5D5FEF]"
                  >
                    {social.platform}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  No has añadido redes sociales.
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Intereses
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {hasInterests ? (
                interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-[#E5E7EB] bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    {getInterestLabel(interest)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  No has seleccionado intereses.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div className="rounded-2xl border border-[#DDE4FF] bg-[#F5F7FF] px-5 py-4">
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-[#5D5FEF]" />

            <div>
              <p className="font-semibold text-slate-900">Perfil listo</p>

              <p className="text-sm text-slate-500">
                Podrás editar toda esta información cuando quieras desde tu
                perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
