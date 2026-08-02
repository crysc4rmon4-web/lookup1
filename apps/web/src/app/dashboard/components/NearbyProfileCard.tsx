"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AtSign,
  MapPin,
  Target,
} from "lucide-react";

import type {
  NearbyProfile,
} from "@lookup/types";

type Props = {
  profile: NearbyProfile;
};

export function NearbyProfileCard({
  profile,
}: Props) {

  const match =
    Math.max(
      60,
      Math.round(
        100 -
        profile.distance * 1.2,
      ),
    );

  return (

    <Link
      href={`/profile/${profile.id}`}
      className="
        block
        rounded-[30px]
        border
        border-[#ECEFF5]
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-[#5D5FEF]/20
        hover:shadow-lg
      "
    >

      <div className="flex gap-4">

        <div
          className="
            relative
            h-[72px]
            w-[72px]
            shrink-0
            overflow-hidden
            rounded-full
            border-[3px]
            border-[#EEF2FF]
            bg-[#EEF2FF]
          "
        >

          {profile.avatar_url ? (

            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Usuario"}
              fill
              className="object-cover"
            />

          ) : (

            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#5D5FEF]">

              {(profile.full_name ?? "U")
                .charAt(0)
                .toUpperCase()}

            </div>

          )}

        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-4">

            <div className="min-w-0">

              <h3 className="truncate text-lg font-black text-slate-900">

                {profile.full_name ??
                  "Usuario"}

              </h3>

              <p className="mt-1 truncate text-sm font-semibold text-[#5D5FEF]">

                {profile.profession ??
                  "Profesional"}

              </p>

            </div>

            <div className="flex flex-col items-end gap-2">

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-[#EEF2FF]
                  px-3
                  py-1
                  text-[11px]
                  font-bold
                  text-[#5D5FEF]
                "
              >

                <Target size={12} />

                {match}% Match

              </span>

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-[#F8F9FC]
                  px-3
                  py-1
                  text-[11px]
                  font-semibold
                  text-slate-600
                "
              >

                <MapPin size={12} />

                {Math.round(profile.distance)} m

              </span>

            </div>

          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">

            {profile.bio ??
              "Sin biografía"}

          </p>

          <div className="mt-5 flex items-center gap-2">

            <AtSign
              size={13}
              className="text-slate-400"
            />

            <span className="truncate text-xs font-bold tracking-wide text-slate-400">

              {profile.username ??
                "usuario"}

            </span>

          </div>

        </div>

      </div>

    </Link>

  );

}