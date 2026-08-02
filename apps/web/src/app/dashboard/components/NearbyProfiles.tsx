"use client";

import Image from "next/image";
import Link from "next/link";

import {
    MapPin,
    ChevronRight,
} from "lucide-react";

import type {
    ProfileRow,
} from "@lookup/services";

type Props = {
    enabled: boolean;
    profiles: ProfileRow[];
};

export function NearbyProfiles({
    enabled,
    profiles,
}: Props) {
    if (!enabled) {

        return (

            <section className="rounded-[2rem] bg-white p-12 text-center shadow-sm">

                <h2 className="text-2xl font-black text-slate-900">

                    Radar desactivado

                </h2>

                <p className="mt-3 text-slate-500">

                    Activa el radar para descubrir personas cerca de ti.

                </p>

            </section>

        );

    }

    return (

        <section className="space-y-4">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#5D5FEF]">
                        PERSONAS CERCA
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                        Cerca de ti
                    </h2>

                </div>

                <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-bold text-[#5D5FEF]">

                    {profiles.length}

                </span>

            </div>
            {profiles.length === 0 && (

                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center">

                    <p className="text-lg font-bold text-slate-700">
                        No hay personas cerca
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                        Activa el radar para descubrir personas alrededor.
                    </p>

                </div>

            )}

            {profiles.map((profile) => (

                <Link
                    key={profile.id}
                    href={`/profile/${profile.id}`}
                    className="block rounded-[1.8rem] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >

                    <div className="flex items-center gap-4">

                        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#5D5FEF] bg-[#EEF2FF]">

                            {profile.avatar_url ? (

                                <Image
                                    src={profile.avatar_url}
                                    alt={
                                        profile.full_name ??
                                        "Usuario"
                                    }
                                    fill
                                    className="object-cover"
                                />

                            ) : (

                                <div className="flex h-full w-full items-center justify-center text-xl font-black text-[#5D5FEF]">

                                    {(profile.full_name ??
                                        profile.username ??
                                        "U")
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

                            <p className="truncate text-sm font-semibold text-[#5D5FEF]">

                                {profile.profession ??
                                    "Profesional"}

                            </p>

                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                                <MapPin
                                    size={15}
                                />

                                <span>

                                    {profile.city ??
                                        "Sin ubicación"}

                                </span>

                            </div>

                        </div>

                        <ChevronRight
                            size={20}
                            className="text-slate-300"
                        />

                    </div>

                    {profile.bio && (

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">

                            {profile.bio}

                        </p>

                    )}

                </Link>

            ))}

        </section>

    );

}