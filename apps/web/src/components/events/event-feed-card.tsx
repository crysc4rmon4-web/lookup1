"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ImageIcon,
} from "lucide-react";
import { getExploreCategory } from "@/lib/events/event-explore-categories";
import { isEventVideo } from "@/lib/events/event-images";
import type { FeedEvent } from "@/services/events/event-feed";
import { EventVideo } from "./event-video";
import { EventLikeButton } from "./event-like-button";
import { EventFavoriteButton } from "./EventFavoriteButton";
import { EventShareButton } from "./event-share-button";

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});
export function EventFeedCard({ event }: { event: FeedEvent }) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(event.isFavorite);
  const [failed, setFailed] = useState(false);
  const media = event.images.length
    ? event.images
    : event.coverImageUrl
      ? [{ publicUrl: event.coverImageUrl, storagePath: "" }]
      : [];
  const active = media[index];
  const category = getExploreCategory(event.category);
  const like = useMemo(
    () =>
      event.likeCount === null
        ? null
        : {
            count: event.likeCount,
            liked: event.isLiked,
            canLike: event.canFavorite,
          },
    [event.likeCount, event.isLiked, event.canFavorite],
  );
  const price = event.isFree
    ? "Gratis"
    : event.priceFrom !== null
      ? `Desde ${new Intl.NumberFormat("es-ES", { style: "currency", currency: event.currency || "EUR" }).format(event.priceFrom)}`
      : "Consultar precio";
  function changeMedia(next: number) {
    setFailed(false);
    setIndex(next);
  }
  return (
    <article aria-label={event.title} className="lookup-reel">
      {event.coverImageUrl ? (
        <Image
          src={event.coverImageUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 640px"
          className="reel-backdrop -z-10 scale-110 object-cover blur-3xl"
        />
      ) : null}
      <div className="reel-layout">
        <div className="reel-main">
          <div className="reel-media">
            <div className="reel-visual">
              {active && !failed ? (
                isEventVideo(active.storagePath || active.publicUrl) ? (
                  <EventVideo
                    key={active.publicUrl}
                    src={active.publicUrl}
                    title={`Vídeo de ${event.title}`}
                    className="relative z-10"
                  />
                ) : (
                  <Image
                    src={active.publicUrl}
                    alt={`Foto ${index + 1} de ${event.title}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 80vw, 540px"
                    className="object-cover"
                    onError={() => setFailed(true)}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <ImageIcon size={40} aria-label="Sin imagen disponible" />
                </div>
              )}
              {media.length > 1 ? (
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/95 p-1 shadow">
                  <button
                    type="button"
                    aria-label="Archivo anterior"
                    disabled={index === 0}
                    onClick={() => changeMedia(index - 1)}
                    className="min-h-11 min-w-11 rounded-full p-2 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span aria-live="polite" className="text-xs font-bold">
                    {index + 1}/{media.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Archivo siguiente"
                    disabled={index === media.length - 1}
                    onClick={() => changeMedia(index + 1)}
                    className="min-h-11 min-w-11 rounded-full p-2 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : null}
            </div>
            <div aria-label="Acciones del evento" className="reel-actions">
              <EventLikeButton eventId={event.id} initial={like} />
              <EventFavoriteButton
                eventId={event.id}
                creatorProfileId={event.creatorProfileId}
                initialIsFavorite={saved}
                initialCanFavorite={event.canFavorite}
                onChange={setSaved}
                iconOnly
                className="min-h-12 min-w-12 !rounded-2xl !px-3 !py-3 shadow-sm"
              />
              <EventShareButton eventId={event.id} title={event.title} />
            </div>
          </div>
          <div className="reel-info space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
              <span
                className="rounded-full px-2.5 py-1"
                style={{
                  color: category.color,
                  backgroundColor: category.surface,
                }}
              >
                {category.label}
              </span>
              <span className="text-slate-600">{price}</span>
            </div>
            <h3 className="line-clamp-2 break-words text-xl font-black leading-tight text-slate-900 sm:text-2xl">
              <Link
                href={`/events/${event.id}`}
                className="reel-detail-link hover:text-[#5557D8]"
              >
                {event.title}
              </Link>
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <CalendarDays size={15} className="shrink-0" />
                <time dateTime={event.startAt}>
                  {dateFormat.format(new Date(event.startAt))}
                </time>
                {event.lifecycleStatus === "live" ? (
                  <span className="font-bold text-emerald-700">Ahora</span>
                ) : null}
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={15} className="shrink-0" />
                <span>
                  {event.venueName || event.address} · {event.city}
                </span>
              </p>
            </div>
            <p className="reel-description line-clamp-2 text-sm leading-relaxed text-slate-500">
              {event.description}
            </p>
            <Link
              href={`/events/${event.id}`}
              className="relative z-10 flex min-h-11 items-center justify-between rounded-xl bg-[#F0F0FF] px-4 py-3 text-sm font-bold text-[#5557D8]"
            >
              Ver evento
              <ChevronRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
