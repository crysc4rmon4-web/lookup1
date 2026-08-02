"use client";

import Image from "next/image";
import Link from "next/link";

import type {
  NearbyProfile,
} from "@lookup/types";

type Props = {
  profile: NearbyProfile;
};

export function NearbyProfileCard({
  profile,
}: Props) {

    return (

        <Link
            href={`/profile/${profile.id}`}
            className="
        block
        rounded-[28px]
        border
        border-[#ECEFF5]
        bg-white
        p-5
        shadow-sm
        transition-all
        hover:-translate-y-0.5
        hover:border-[#5D5FEF]/20
        hover:shadow-md
      "
        >

            <div className="flex items-start gap-4">

                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#EEF2FF]">

                    {profile.avatar_url ? (

                        <Image
                            src={profile.avatar_url}
                            alt={profile.full_name ?? "Usuario"}
                            fill
                            className="object-cover"
                        />

                    ) : (

                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-[#5D5FEF]">

                            {(profile.full_name ?? "U")
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                    )}

                </div>

                <div className="min-w-0 flex-1">

                    <h3 className="truncate text-lg font-black text-slate-900">

                        {profile.full_name ??
                            "Usuario"}

                    </h3>

                    {profile.profession && (

                        <p className="mt-1 text-sm font-medium text-slate-500">

                            {profile.profession}

                        </p>

                    )}

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">

                        {profile.bio ||
                            "Sin biografía"}

                    </p>

                </div>

                <div className="text-right">

                    <p className="text-sm font-bold text-[#5D5FEF]">

                        {Math.round(profile.distance)} m

                    </p>

                </div>

            </div>



        </Link>

    );
}