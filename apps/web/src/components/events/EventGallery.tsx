"use client";

import {
    ChevronLeft,
    ChevronRight,
    Images,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import type {
    PersistedEventImage,
} from "@/lib/events/event-images";

import {
    EventCoverImage,
} from "./EventCoverImage";

type EventGalleryProps = {
    title:
    string;

    images:
    PersistedEventImage[];

    coverImageUrl?:
    string | null;
};

export function EventGallery({
    title,
    images,
    coverImageUrl,
}: EventGalleryProps) {
    const gallery =
        useMemo(
            () => {
                if (
                    images.length >
                    0
                ) {
                    return [
                        ...images,
                    ].sort(
                        (
                            first,
                            second,
                        ) =>
                            first.position -
                            second.position,
                    );
                }

                if (
                    coverImageUrl
                ) {
                    return [
                        {
                            id:
                                "legacy-cover",

                            storagePath:
                                "",

                            publicUrl:
                                coverImageUrl,

                            position:
                                0,
                        },
                    ];
                }

                return [];
            },
            [
                images,
                coverImageUrl,
            ],
        );

    const [
        activeIndex,
        setActiveIndex,
    ] =
        useState(
            0,
        );

    useEffect(
        () => {
            setActiveIndex(
                0,
            );
        },
        [
            gallery.length,
        ],
    );

    if (
        gallery.length ===
        0
    ) {
        return null;
    }

    const activeImage =
        gallery[
        activeIndex
        ] ??
        gallery[0];

    if (!activeImage) {
        return null;
    }

    const showNavigation =
        gallery.length >
        1;

    function previousImage() {
        setActiveIndex(
            (current) =>
                current === 0
                    ? gallery.length -
                    1
                    : current -
                    1,
        );
    }

    function nextImage() {
        setActiveIndex(
            (current) =>
                current ===
                    gallery.length -
                    1
                    ? 0
                    : current +
                    1,
        );
    }

    return (
        <section
            aria-label={`Galería de ${title}`}
            className="overflow-hidden bg-slate-100"
        >
            <div className="group relative aspect-[16/10] overflow-hidden bg-slate-100 sm:aspect-[16/8]">
                <EventCoverImage
                    src={
                        activeImage.publicUrl
                    }
                    alt={`Imagen ${activeIndex + 1} de ${title}`}
                    className="absolute inset-0"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />

                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/55 px-3 py-1.5 text-[11px] font-black text-white shadow-sm backdrop-blur-md">
                    <Images
                        size={13}
                    />

                    {activeIndex +
                        1}
                    /
                    {
                        gallery.length
                    }
                </div>

                {showNavigation ? (
                    <>
                        <button
                            type="button"
                            onClick={
                                previousImage
                            }
                            aria-label="Imagen anterior"
                            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg transition hover:scale-105 hover:bg-white"
                        >
                            <ChevronLeft
                                size={20}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={
                                nextImage
                            }
                            aria-label="Imagen siguiente"
                            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg transition hover:scale-105 hover:bg-white"
                        >
                            <ChevronRight
                                size={20}
                            />
                        </button>
                    </>
                ) : null}
            </div>

            {showNavigation ? (
                <div className="flex gap-2 overflow-x-auto bg-white p-3 sm:p-4">
                    {gallery.map(
                        (
                            image,
                            index,
                        ) => (
                            <button
                                key={
                                    image.id
                                }
                                type="button"
                                onClick={() =>
                                    setActiveIndex(
                                        index,
                                    )
                                }
                                aria-label={`Ver imagen ${index + 1}`}
                                aria-current={
                                    index ===
                                        activeIndex
                                        ? "true"
                                        : undefined
                                }
                                className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition sm:w-24 ${index ===
                                    activeIndex
                                    ? "border-[#5D5FEF] shadow-sm"
                                    : "border-transparent opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <EventCoverImage
                                    src={
                                        image.publicUrl
                                    }
                                    alt={`Miniatura ${index + 1} de ${title}`}
                                    className="absolute inset-0"
                                />
                            </button>
                        ),
                    )}
                </div>
            ) : null}
        </section>
    );
}