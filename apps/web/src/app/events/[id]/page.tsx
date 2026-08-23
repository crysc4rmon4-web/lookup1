"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CircleDot,
  ExternalLink,
  MapPin,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import Link from "next/link";

import {
  use,
  useEffect,
  useState,
} from "react";

import {
  getPublicProfileById,
  type PublicProfile,
} from "@lookup/services";

import {
  useAuth,
} from "@/components/auth-provider";

import {
  EventFavoriteButton,
} from "@/components/events/EventFavoriteButton";

import {
  getPublicEvent,
  type PublicEvent,
} from "@/services/events/get-public-event";

type Props = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    returnTo?:
      | string
      | string[];
  }>;
};

function getSafeInternalPath(
  value:
    | string
    | string[]
    | undefined,
) {
  const rawValue =
    Array.isArray(
      value,
    )
      ? value[0]
      : value;

  const normalized =
    rawValue?.trim() ??
    "";

  if (
    !normalized.startsWith(
      "/",
    ) ||
    normalized.startsWith(
      "//",
    )
  ) {
    return "";
  }

  return normalized;
}

function formatDate(
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
        "long",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",

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
    PublicEvent,
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

function getInitials(
  value: string,
) {
  return value
    .split(
      " ",
    )
    .filter(
      Boolean,
    )
    .slice(
      0,
      2,
    )
    .map(
      (
        part,
      ) =>
        part.charAt(
          0,
        ),
    )
    .join(
      "",
    )
    .toUpperCase();
}

export default function PublicEventPage({
  params,
  searchParams,
}: Props) {
  const {
    id,
  } =
    use(
      params,
    );

  const query =
    use(
      searchParams,
    );

  const returnTo =
    getSafeInternalPath(
      query.returnTo,
    );

  /*
   * Nunca usamos router.back() aquí.
   *
   * El detalle del evento tiene un destino de retorno
   * explícito, evitando bucles:
   *
   * Evento -> Perfil -> Evento -> Perfil...
   */
  const backHref =
    returnTo ||
    "/dashboard?section=events";

  const {
    session,
    loading:
      authLoading,
  } =
    useAuth();

  const [
    event,
    setEvent,
  ] =
    useState<
      PublicEvent | null
    >(null);

  const [
    creator,
    setCreator,
  ] =
    useState<
      PublicProfile | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    if (
      authLoading
    ) {
      return;
    }

    const accessToken =
      session
        ?.access_token
        ?.trim();

    if (
      !accessToken
    ) {
      setLoading(
        false,
      );

      setEvent(
        null,
      );

      setCreator(
        null,
      );

      setError(
        "Necesitas iniciar sesión para ver este evento.",
      );

      return;
    }

    const validAccessToken =
      accessToken;

    const controller =
      new AbortController();

    let cancelled =
      false;

    async function loadEvent() {
      setLoading(
        true,
      );

      setError(
        null,
      );

      try {
        const publicEvent =
          await getPublicEvent({
            accessToken:
              validAccessToken,

            eventId:
              id,

            signal:
              controller.signal,
          });

        if (
          cancelled
        ) {
          return;
        }

        setEvent(
          publicEvent,
        );

        try {
          const publicCreator =
            await getPublicProfileById(
              publicEvent.creatorProfileId,
            );

          if (
            !cancelled
          ) {
            setCreator(
              publicCreator,
            );
          }
        } catch (
        creatorError
        ) {
          console.error(
            "❌ Error cargando creador público:",
            creatorError,
          );

          if (
            !cancelled
          ) {
            setCreator(
              null,
            );
          }
        }
      } catch (
      loadError
      ) {
        if (
          cancelled ||
          controller.signal
            .aborted
        ) {
          return;
        }

        setEvent(
          null,
        );

        setCreator(
          null,
        );

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "No se pudo cargar el evento.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadEvent();

    return () => {
      cancelled =
        true;

      controller.abort();
    };
  }, [
    authLoading,
    id,
    session
      ?.access_token,
  ]);

  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-[#F7F8FC]">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Sparkles
              size={28}
              className="mx-auto animate-pulse text-[#5D5FEF]"
            />

            <p className="mt-4 text-sm font-black text-slate-600">
              Cargando evento…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !event
  ) {
    return (
      <main className="min-h-screen bg-[#F7F8FC]">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <Link
            href={
              backHref
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#5557D8] transition hover:text-[#494BC8]"
          >
            <ArrowLeft
              size={17}
            />

            Volver a eventos
          </Link>

          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8">
            <h1 className="text-xl font-black text-rose-900">
              Evento no disponible
            </h1>

            <p className="mt-2 text-sm leading-6 text-rose-700">
              {
                error ??
                "Este evento no está disponible públicamente."
              }
            </p>
          </div>
        </div>
      </main>
    );
  }

  const creatorName =
    creator
      ? creator.account_type ===
          "business"
        ? creator.business_trade_name ??
          creator.display_name
        : creator.display_name
      : "Creador";

  const profileHref =
    creator
      ? `/profile/${creator.id}?from=event&eventId=${encodeURIComponent(
          event.id,
        )}&returnTo=${encodeURIComponent(
          backHref,
        )}`
      : "";

  const mapsHref =
    event.latitude !==
      null &&
    event.longitude !==
      null
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${event.latitude},${event.longitude}`,
        )}`
      : null;

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <div className="mx-auto max-w-3xl px-5 py-8 pb-24">
        <Link
          href={
            backHref
          }
          className="group mb-5 inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-black text-[#5557D8] transition hover:text-[#494BC8]"
        >
          <ArrowLeft
            size={17}
            className="transition-transform group-hover:-translate-x-0.5"
          />

          Volver a eventos
        </Link>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
          <header className="bg-gradient-to-br from-[#5D5FEF] via-[#6668F4] to-[#7568F5] p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em]">
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

                {event.lifecycleStatus ===
                "live"
                  ? "En curso"
                  : event.lifecycleStatus ===
                      "ended"
                    ? "Finalizado"
                    : "Próximo"}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em]">
                {
                  event.category
                }
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {
                event.title
              }
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-50 sm:text-base">
              {
                event.description
              }
            </p>
          </header>

          <div className="space-y-6 p-5 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F8F8FF] p-4">
                <CalendarDays
                  size={19}
                  className="text-[#5D5FEF]"
                />

                <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                  Comienza
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {formatDate(
                    event.startAt,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8F8FF] p-4">
                <MapPin
                  size={19}
                  className="text-[#5D5FEF]"
                />

                <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-slate-400">
                  Lugar
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {
                    event.venueName
                  }
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {
                    event.address
                  }
                  {" · "}
                  {
                    event.city
                  }

                  {event.province
                    ? ` · ${event.province}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">
                  Precio
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {formatPrice(
                    event,
                  )}
                </p>
              </div>

              {event.capacity ? (
                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Users
                      size={13}
                    />

                    Aforo
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-900">
                    {
                      event.capacity
                    }{" "}
                    personas
                  </p>
                </div>
              ) : null}
            </div>

            {event.tags.length >
            0 ? (
              <section>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#5D5FEF]">
                  Temas
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {event.tags.map(
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
              </section>
            ) : null}

            {creator ? (
              <section className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5D5FEF]">
                  Organizado por
                </p>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {creator.avatar_url ? (
                      <img
                        src={
                          creator.avatar_url
                        }
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D5FEF] text-sm font-black text-white">
                        {
                          getInitials(
                            creatorName,
                          )
                        }
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {creator.account_type ===
                        "business" ? (
                          <Building2
                            size={16}
                            className="text-[#5D5FEF]"
                          />
                        ) : (
                          <UserRound
                            size={16}
                            className="text-[#5D5FEF]"
                          />
                        )}

                        <p className="truncate font-black text-slate-950">
                          {
                            creatorName
                          }
                        </p>
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {creator.account_type ===
                        "business"
                          ? creator.business_sector ??
                            "Negocio"
                          : creator.profession ??
                            "Persona"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={
                      profileHref
                    }
                    className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E1E2FA] bg-white px-4 py-2.5 text-xs font-black text-[#5557D8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#CFCFFF] hover:bg-[#F8F8FF] hover:shadow-md"
                  >
                    Ver perfil

                    <ArrowUpRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>
              </section>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <EventFavoriteButton
                eventId={
                  event.id
                }
                creatorProfileId={
                  event.creatorProfileId
                }
                className="w-full"
              />

              {event.externalUrl ? (
                <a
                  href={
                    event.externalUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5D5FEF] to-[#7066F4] px-5 py-3 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#5D5FEF]/20"
                >
                  <ExternalLink
                    size={17}
                  />

                  {event.externalActionLabel?.trim() ||
                    "Más información"}
                </a>
              ) : null}
            </div>

            {mapsHref ? (
              <a
                href={
                  mapsHref
                }
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-between gap-4 rounded-[1.4rem] border border-[#E1E2FA] bg-gradient-to-r from-[#FBFBFF] to-[#F4F3FF] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#CFCFFF] hover:shadow-md hover:shadow-[#5D5FEF]/10"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5D5FEF] shadow-sm">
                    <MapPin
                      size={18}
                    />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#5D5FEF]">
                      Ubicación
                    </span>

                    <span className="mt-0.5 block text-sm font-black text-slate-900">
                      Abrir en Google Maps
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {
                        event.venueName
                      }
                      {" · "}
                      {
                        event.city
                      }
                    </span>
                  </span>
                </span>

                <ArrowUpRight
                  size={17}
                  className="shrink-0 text-[#5D5FEF] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </main>
  );
}