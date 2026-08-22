"use client";

import {
  CalendarDays,
  CircleDot,
  MapPin,
  Users,
} from "lucide-react";

import {
  EventFavoriteButton,
} from "./EventFavoriteButton";

export type EventDiscoveryCardEvent = {
  id: string;

  creatorProfileId:
    string;

  title:
    string;

  description:
    string;

  category:
    string;

  tags:
    string[];

  venueName:
    string;

  city:
    string;

  province:
    string | null;

  startAt:
    string;

  lifecycleStatus:
    | "upcoming"
    | "live"
    | "ended";

  isFree:
    boolean;

  priceFrom:
    number | null;

  currency:
    string;

  capacity:
    number | null;

  isFavorite:
    boolean;

  canFavorite:
    boolean;
};

type EventDiscoveryCardProps = {
  event:
    EventDiscoveryCardEvent;

  onOpen: (
    eventId: string,
  ) => void;

  onFavoriteChange?: (
    isFavorite: boolean,
  ) => void;
};

function formatEventDate(
  value: string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Fecha pendiente";
  }

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      weekday:
        "short",

      day:
        "numeric",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",

      timeZone:
        "Europe/Madrid",
    },
  ).format(
    date,
  );
}

function formatPrice(
  event:
    EventDiscoveryCardEvent,
) {
  if (
    event.isFree
  ) {
    return "Gratis";
  }

  if (
    event.priceFrom !==
    null
  ) {
    return `Desde ${event.priceFrom} ${event.currency}`;
  }

  return "De pago";
}

function getLifecycleLabel(
  lifecycle:
    EventDiscoveryCardEvent["lifecycleStatus"],
) {
  if (
    lifecycle ===
    "live"
  ) {
    return "En curso";
  }

  if (
    lifecycle ===
    "ended"
  ) {
    return "Finalizado";
  }

  return "Próximo";
}

function getLifecycleClasses(
  lifecycle:
    EventDiscoveryCardEvent["lifecycleStatus"],
) {
  if (
    lifecycle ===
    "live"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    lifecycle ===
    "ended"
  ) {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-[#F0F0FF] text-[#5557D8]";
}

export function EventDiscoveryCard({
  event,
  onOpen,
  onFavoriteChange,
}: EventDiscoveryCardProps) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition hover:border-[#5D5FEF]/20 hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getLifecycleClasses(
                event.lifecycleStatus,
              )}`}
            >
              {event.lifecycleStatus ===
              "live" ? (
                <CircleDot
                  size={12}
                />
              ) : (
                <CalendarDays
                  size={12}
                />
              )}

              {getLifecycleLabel(
                event.lifecycleStatus,
              )}
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
              {
                event.category
              }
            </span>
          </div>

          <EventFavoriteButton
            eventId={
              event.id
            }
            creatorProfileId={
              event.creatorProfileId
            }
            initialIsFavorite={
              event.isFavorite
            }
            initialCanFavorite={
              event.canFavorite
            }
            onChange={
              onFavoriteChange
            }
            className="shrink-0 px-3 py-2 text-xs"
          />
        </div>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
          {
            event.title
          }
        </h2>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
          {
            event.description
          }
        </p>

        {event.tags.length >
        0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {event.tags
              .slice(
                0,
                5,
              )
              .map(
                (
                  tag,
                ) => (
                  <span
                    key={
                      tag
                    }
                    className="rounded-full bg-[#F0F0FF] px-3 py-1.5 text-xs font-black text-[#5052D9]"
                  >
                    {
                      tag
                    }
                  </span>
                ),
              )}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F8FF] px-4 py-3.5">
            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-[#5D5FEF]"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">
                {
                  event.venueName
                }
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-500">
                {
                  event.city
                }

                {event.province
                  ? ` · ${event.province}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F8FF] px-4 py-3.5">
            <CalendarDays
              size={17}
              className="mt-0.5 shrink-0 text-[#5D5FEF]"
            />

            <div>
              <p className="text-sm font-black text-slate-900">
                {formatEventDate(
                  event.startAt,
                )}
              </p>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {formatPrice(
                  event,
                )}
              </p>
            </div>
          </div>
        </div>

        {event.capacity ? (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Users
              size={15}
              className="text-[#5D5FEF]"
            />

            Aforo máximo:{" "}
            {
              event.capacity
            }
          </div>
        ) : null}

        <button
          type="button"
          onClick={() =>
            onOpen(
              event.id,
            )
          }
          className="mt-5 w-full rounded-2xl bg-[#5D5FEF] py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition hover:bg-[#5254DF]"
        >
          Ver evento
        </button>
      </div>
    </article>
  );
}