"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

import {
  useAuth,
} from "@/components/auth-provider";

import type {
  CreatedEventDraft,
} from "@/lib/events/event-domain";

import {
  getMyEvents,
  type EventLifecycleStatus,
  type MyEvent,
} from "@/services/events/get-my-events";

export type EventCard = {
  id: string;

  title: string;

  description: string;

  place: string;

  date: string;

  attendees: number;
};

type EventsViewProps = {
  events:
  EventCard[];

  city?:
  string | null;

  createdDraft?:
  CreatedEventDraft | null;

  onCreateEvent:
  () => void;

  onJoinEvent: (
    id: string,
  ) => void;
};

type EventsTab =
  | "explore"
  | "saved"
  | "mine";

type MyEventsFilter =
  | "all"
  | EventLifecycleStatus;
function getInitialEventsTab(): EventsTab {
  if (typeof window === "undefined") {
    return "explore";
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  const tab =
    params.get(
      "eventsTab",
    );

  if (
    tab === "saved" ||
    tab === "mine"
  ) {
    return tab;
  }

  return "explore";
}
const STATUS_ORDER:
  EventLifecycleStatus[] =
  [
    "draft",
    "upcoming",
    "live",
    "ended",
    "cancelled",
  ];

const STATUS_LABELS:
  Record<
    EventLifecycleStatus,
    string
  > = {
  draft:
    "Borrador",

  upcoming:
    "Próximo",

  live:
    "En curso",

  ended:
    "Finalizado",

  cancelled:
    "Cancelado",
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

function getStatusClasses(
  status:
    EventLifecycleStatus,
) {
  switch (
  status
  ) {
    case "draft":
      return "bg-amber-50 text-amber-700";

    case "upcoming":
      return "bg-blue-50 text-blue-700";

    case "live":
      return "bg-emerald-50 text-emerald-700";

    case "ended":
      return "bg-slate-100 text-slate-600";

    case "cancelled":
      return "bg-rose-50 text-rose-700";
  }
}

function getStatusIcon(
  status:
    EventLifecycleStatus,
) {
  switch (
  status
  ) {
    case "draft":
      return (
        <Clock3
          size={13}
        />
      );

    case "upcoming":
      return (
        <CalendarDays
          size={13}
        />
      );

    case "live":
      return (
        <CircleDot
          size={13}
        />
      );

    case "ended":
      return (
        <Check
          size={13}
        />
      );

    case "cancelled":
      return (
        <Clock3
          size={13}
        />
      );
  }
}

export function EventsView({
  events,
  city,
  createdDraft = null,
  onCreateEvent,
  onJoinEvent,
}: EventsViewProps) {
  const {
    session,
  } =
    useAuth();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<EventsTab>(
      getInitialEventsTab,
    );
  useEffect(() => {
    const url =
      new URL(
        window.location.href,
      );

    if (
      activeTab === "explore"
    ) {
      url.searchParams.delete(
        "eventsTab",
      );
    } else {
      url.searchParams.set(
        "eventsTab",
        activeTab,
      );
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [
    activeTab,
  ]);
  const [
    myEvents,
    setMyEvents,
  ] =
    useState<
      MyEvent[]
    >([]);

  const [
    myEventsLoading,
    setMyEventsLoading,
  ] =
    useState(false);

  const [
    myEventsError,
    setMyEventsError,
  ] =
    useState<
      string | null
    >(null);

  const [
    myEventsFilter,
    setMyEventsFilter,
  ] =
    useState<MyEventsFilter>(
      "all",
    );

  const normalizedCity =
    city?.trim() ||
    "tu ciudad";

  const loadMyEvents =
    useCallback(
      async () => {
        const accessToken =
          session
            ?.access_token;

        if (!accessToken) {
          setMyEvents(
            [],
          );

          setMyEventsError(
            "Tu sesión no es válida.",
          );

          return;
        }

        setMyEventsLoading(
          true,
        );

        setMyEventsError(
          null,
        );

        try {
          const result =
            await getMyEvents(
              accessToken,
            );

          setMyEvents(
            result,
          );
        } catch (error) {
          setMyEvents(
            [],
          );

          setMyEventsError(
            error instanceof
              Error
              ? error.message
              : "No se pudieron cargar tus eventos.",
          );
        } finally {
          setMyEventsLoading(
            false,
          );
        }
      },
      [
        session
          ?.access_token,
      ],
    );

  useEffect(() => {
    if (
      activeTab !==
      "mine"
    ) {
      return;
    }

    void loadMyEvents();
  }, [
    activeTab,
    loadMyEvents,
  ]);

  useEffect(() => {
    if (
      !createdDraft
    ) {
      return;
    }

    setActiveTab(
      "mine",
    );

    void loadMyEvents();
  }, [
    createdDraft,
    loadMyEvents,
  ]);

  const statusCounts =
    useMemo(
      () => {
        const counts:
          Record<
            EventLifecycleStatus,
            number
          > = {
          draft:
            0,

          upcoming:
            0,

          live:
            0,

          ended:
            0,

          cancelled:
            0,
        };

        for (
          const event
          of myEvents
        ) {
          counts[
            event.lifecycleStatus
          ] += 1;
        }

        return counts;
      },
      [
        myEvents,
      ],
    );

  const filteredMyEvents =
    useMemo(
      () => {
        if (
          myEventsFilter ===
          "all"
        ) {
          return myEvents;
        }

        return myEvents.filter(
          (event) =>
            event.lifecycleStatus ===
            myEventsFilter,
        );
      },
      [
        myEvents,
        myEventsFilter,
      ],
    );

  return (
    <section className="space-y-5 pb-24">
      <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-lg sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-violet-200">
              <Sparkles
                size={13}
              />

              Descubre
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-[2rem]">
              Eventos en{" "}
              <span className="text-violet-300">
                {
                  normalizedCity
                }
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
              Descubre lo que está pasando, guarda lo que te interese y gestiona tus propias experiencias desde un solo lugar.
            </p>
          </div>

          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-violet-300 sm:flex">
            <CalendarDays
              size={25}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={
            onCreateEvent
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-violet-50 sm:w-auto"
        >
          <Plus
            size={18}
          />

          Crear evento
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setActiveTab(
              "explore",
            )
          }
          className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab ===
            "explore"
            ? "bg-[#5D5FEF] text-white shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
        >
          Explorar
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              "saved",
            )
          }
          className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab ===
            "saved"
            ? "bg-[#5D5FEF] text-white shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
        >
          Guardados
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              "mine",
            )
          }
          className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab ===
            "mine"
            ? "bg-[#5D5FEF] text-white shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
        >
          Mis eventos
        </button>
      </div>

      {activeTab ===
        "explore" ? (
        <>
          {events.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
                <CalendarDays
                  size={30}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                Aquí aparecerán los eventos relevantes para ti
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                El feed por ciudad, fecha, intereses e intención se conectará sobre esta experiencia.
              </p>

              <button
                type="button"
                onClick={
                  onCreateEvent
                }
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF]"
              >
                <Plus
                  size={17}
                />

                Crear evento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(
                (event) => (
                  <article
                    key={
                      event.id
                    }
                    className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm"
                  >
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      {
                        event.title
                      }
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {
                        event.description
                      }
                    </p>

                    <div className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <MapPin
                          size={18}
                          className="text-[#5D5FEF]"
                        />

                        {
                          event.place
                        }
                      </div>

                      <div className="flex items-center gap-2.5">
                        <CalendarDays
                          size={18}
                          className="text-[#5D5FEF]"
                        />

                        {
                          event.date
                        }
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Users
                          size={18}
                          className="text-[#5D5FEF]"
                        />

                        {
                          event.attendees
                        }{" "}
                        asistentes
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onJoinEvent(
                          event.id,
                        )
                      }
                      className="mt-6 w-full rounded-2xl bg-[#5D5FEF] py-3.5 text-sm font-black text-white transition hover:bg-[#5254DF]"
                    >
                      Ver evento
                    </button>
                  </article>
                ),
              )}
            </div>
          )}
        </>
      ) : null}

      {activeTab ===
        "saved" ? (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
            <Bookmark
              size={29}
            />
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            Tus eventos guardados vivirán aquí
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Cuando conectemos favoritos, podrás guardar eventos de otras personas y negocios para encontrarlos rápidamente.
          </p>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "explore",
              )
            }
            className="mt-6 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Explorar eventos
          </button>
        </div>
      ) : null}

      {activeTab ===
        "mine" ? (
        <div className="space-y-4">
          {createdDraft ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-black text-emerald-900">
                  Borrador guardado
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-emerald-700">
                  “{createdDraft.title}” ya forma parte de tus eventos.
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                  Gestión
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Mis eventos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    myEvents.length
                  }{" "}
                  evento
                  {
                    myEvents.length ===
                      1
                      ? ""
                      : "s"
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadMyEvents()
                }
                disabled={
                  myEventsLoading
                }
                aria-label="Actualizar mis eventos"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    myEventsLoading
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>

            {myEvents.length >
              0 ? (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setMyEventsFilter(
                      "all",
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${myEventsFilter ===
                    "all"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  Todos ·{" "}
                  {
                    myEvents.length
                  }
                </button>

                {STATUS_ORDER.map(
                  (
                    status,
                  ) => (
                    <button
                      key={
                        status
                      }
                      type="button"
                      onClick={() =>
                        setMyEventsFilter(
                          status,
                        )
                      }
                      className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${myEventsFilter ===
                        status
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {
                        STATUS_LABELS[
                        status
                        ]
                      }{" "}
                      ·{" "}
                      {
                        statusCounts[
                        status
                        ]
                      }
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>

          {myEventsLoading &&
            myEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm">
              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-[#5D5FEF]"
              />

              <p className="mt-4 text-sm font-bold text-slate-600">
                Cargando tus eventos…
              </p>
            </div>
          ) : null}

          {myEventsError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
              <p className="text-sm font-black text-rose-800">
                No pudimos cargar tus eventos
              </p>

              <p className="mt-2 text-sm leading-6 text-rose-700">
                {
                  myEventsError
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadMyEvents()
                }
                className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!myEventsLoading &&
            !myEventsError &&
            myEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
                <CalendarDays
                  size={29}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                Todavía no has creado ningún evento
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Cuando crees uno, podrás gestionarlo desde aquí durante todo su ciclo de vida.
              </p>

              <button
                type="button"
                onClick={
                  onCreateEvent
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white"
              >
                <Plus
                  size={17}
                />

                Crear evento
              </button>
            </div>
          ) : null}

          {!myEventsLoading &&
            !myEventsError &&
            myEvents.length >
            0 &&
            filteredMyEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-7 text-center shadow-sm">
              <p className="text-sm font-black text-slate-800">
                No tienes eventos en este estado.
              </p>
            </div>
          ) : null}

          {filteredMyEvents.map(
            (event) => (
              <article
                key={
                  event.id
                }
                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getStatusClasses(
                            event.lifecycleStatus,
                          )}`}
                        >
                          {getStatusIcon(
                            event.lifecycleStatus,
                          )}

                          {
                            STATUS_LABELS[
                            event
                              .lifecycleStatus
                            ]
                          }
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                          {
                            event.category
                          }
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                        {
                          event.title
                        }
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                    {
                      event.description
                    }
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
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

                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
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

                        <p className="mt-0.5 text-xs text-slate-500">
                          {event.isFree
                            ? "Gratis"
                            : event.priceFrom !==
                              null
                              ? `Desde ${event.priceFrom} ${event.currency}`
                              : "De pago"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {event.lifecycleStatus ===
                    "draft" ? (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F0F0FF] px-4 py-3.5">
                      <Sparkles
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5D5FEF]"
                      />

                      <div>
                        <p className="text-sm font-black text-[#494BC8]">
                          Listo para LookUp Intelligence
                        </p>

                        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                          En el siguiente bloque conectaremos análisis, edición y publicación desde esta misma tarjeta.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}