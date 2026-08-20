"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/components/auth-provider";

import type {
  EventDraftIntelligenceResult,
} from "@/lib/events/event-intelligence-types";

import {
  getMyEvent,
} from "@/services/events/get-my-event";

import {
  getSavedEventIntelligence,
} from "@/services/events/get-saved-event-intelligence";

import {
  getEventDraftIntelligence,
} from "@/services/events/get-event-draft-intelligence";

import {
  publishEventDraft,
} from "@/services/events/publish-event-draft";

import type {
  EventLifecycleStatus,
  MyEvent,
} from "@/services/events/get-my-events";

const STATUS_LABELS:
  Record<
    EventLifecycleStatus,
    string
  > = {
  draft: "Borrador",
  upcoming: "Próximo",
  live: "En curso",
  ended: "Finalizado",
  cancelled: "Cancelado",
};

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
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        "Europe/Madrid",
    },
  ).format(
    date,
  );
}

export default function EventManagementPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const {
    session,
  } =
    useAuth();

  const eventId =
    typeof params.id ===
    "string"
      ? params.id
      : "";

  const [
    event,
    setEvent,
  ] =
    useState<
      MyEvent | null
    >(null);

  const [
    intelligence,
    setIntelligence,
  ] =
    useState<
      EventDraftIntelligenceResult | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(false);

  const [
    publishing,
    setPublishing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const loadEvent =
    useCallback(
      async () => {
        const token =
          session
            ?.access_token;

        if (
          !token ||
          !eventId
        ) {
          return;
        }

        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const [
            eventResult,
            intelligenceResult,
          ] =
            await Promise.all([
              getMyEvent(
                token,
                eventId,
              ),

              getSavedEventIntelligence(
                token,
                eventId,
              ),
            ]);

          setEvent(
            eventResult,
          );

          setIntelligence(
            intelligenceResult,
          );
        } catch (loadError) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "No se pudo cargar el evento.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        session
          ?.access_token,
        eventId,
      ],
    );

  useEffect(() => {
    void loadEvent();
  }, [
    loadEvent,
  ]);

  async function handleAnalyze() {
    const token =
      session
        ?.access_token;

    if (
      !token ||
      !event ||
      analyzing
    ) {
      return;
    }

    setAnalyzing(
      true,
    );

    setError(
      null,
    );

    try {
      const result =
        await getEventDraftIntelligence(
          token,
          event.id,
        );

      setIntelligence(
        result,
      );
    } catch (analysisError) {
      setError(
        analysisError instanceof
          Error
          ? analysisError.message
          : "No se pudo analizar el evento.",
      );
    } finally {
      setAnalyzing(
        false,
      );
    }
  }

  async function handlePublish() {
    const token =
      session
        ?.access_token;

    if (
      !token ||
      !event ||
      publishing
    ) {
      return;
    }

    setPublishing(
      true,
    );

    setError(
      null,
    );

    try {
      await publishEventDraft(
        token,
        event.id,
      );

      await loadEvent();
    } catch (publishError) {
      setError(
        publishError instanceof
          Error
          ? publishError.message
          : "No se pudo publicar el evento.",
      );
    } finally {
      setPublishing(
        false,
      );
    }
  }

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle
            size={30}
            className="animate-spin text-[#5D5FEF]"
          />

          <p className="text-sm font-bold text-slate-500">
            Cargando evento…
          </p>
        </div>
      </main>
    );
  }

  if (
    !event
  ) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] p-6">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CircleAlert
            size={34}
            className="mx-auto text-rose-500"
          />

          <h1 className="mt-4 text-xl font-black text-slate-950">
            No pudimos abrir este evento
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {
              error ??
              "El evento no está disponible."
            }
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard?section=events&eventsTab=mine",
              )
            }
            className="mt-6 rounded-2xl bg-[#5D5FEF] px-5 py-3 text-sm font-black text-white"
          >
            Volver a Mis eventos
          </button>
        </div>
      </main>
    );
  }

  const isDraft =
    event.lifecycleStatus ===
    "draft";

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-5 pb-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard?section=events&eventsTab=mine",
            )
          }
          className="inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-black text-[#5D5FEF] transition hover:text-[#4F51D8]"
        >
          <ArrowLeft
            size={18}
          />

          Mis eventos
        </button>

        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#5D5FEF] via-[#6668F4] to-[#7B6CF6] p-6 text-white shadow-lg shadow-[#5D5FEF]/20 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
              {
                STATUS_LABELS[
                  event.lifecycleStatus
                ]
              }
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-50">
              {
                event.category
              }
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight">
            {
              event.title
            }
          </h1>

          <p className="mt-3 text-sm leading-6 text-indigo-50">
            {
              event.description
            }
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#F8F8FF] p-4">
              <MapPin
                size={18}
                className="text-[#5D5FEF]"
              />

              <p className="mt-2 font-black text-slate-950">
                {
                  event.venueName
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {
                  event.address
                }
              </p>

              <p className="text-sm text-slate-500">
                {
                  event.city
                }

                {event.province
                  ? ` · ${event.province}`
                  : ""}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8F8FF] p-4">
              <CalendarDays
                size={18}
                className="text-[#5D5FEF]"
              />

              <p className="mt-2 font-black text-slate-950">
                {formatDate(
                  event.startAt,
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Hasta{" "}
                {formatDate(
                  event.endAt,
                )}
              </p>
            </div>
          </div>

          {event.tags.length >
          0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.map(
                (tag) => (
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

          {event.audience.length >
          0 ? (
            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Pensado para
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {event.audience.map(
                  (
                    audience,
                  ) => (
                    <span
                      key={
                        audience
                      }
                      className="rounded-full border border-[#5D5FEF]/15 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
                    >
                      {
                        audience
                      }
                    </span>
                  ),
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Users
                size={17}
                className="text-[#5D5FEF]"
              />

              {event.capacity
                ? `Aforo: ${event.capacity}`
                : "Aforo no especificado"}
            </div>

            <div className="font-black text-slate-700">
              {event.isFree
                ? "Gratis"
                : event.priceFrom !==
                    null
                  ? `Desde ${event.priceFrom} ${event.currency}`
                  : "De pago"}
            </div>
          </div>

          {event.externalUrl ? (
            <a
              href={
                event.externalUrl
              }
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#5D5FEF]/20 bg-[#F8F8FF] px-4 py-3 text-sm font-black text-[#5557D8] transition hover:bg-[#F0F0FF]"
            >
              <ExternalLink
                size={16}
              />

              {event.externalActionLabel ||
                "Abrir enlace externo"}
            </a>
          ) : null}
        </section>

        {isDraft ? (
          <section className="rounded-[2rem] border border-[#5D5FEF]/15 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
                <Sparkles
                  size={20}
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#5D5FEF]">
                  LookUp Intelligence
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Revisión pre-publicación
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Analizamos la preparación del evento sin bloquear tu decisión de publicarlo.
                </p>
              </div>
            </div>

            {intelligence ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.5rem] bg-gradient-to-r from-[#5D5FEF] to-[#7568F5] p-5 text-white shadow-md shadow-[#5D5FEF]/15">
                  <p className="text-xs font-bold text-indigo-100">
                    Preparación
                  </p>

                  <p className="mt-1 text-4xl font-black">
                    {
                      intelligence
                        .readiness
                        .score
                    }

                    <span className="text-lg text-indigo-100">
                      /100
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="font-black text-slate-950">
                    {
                      intelligence
                        .advice
                        .title
                    }
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {
                      intelligence
                        .advice
                        .message
                    }
                  </p>

                  {intelligence
                    .advice
                    .recommendation ? (
                    <p className="mt-3 rounded-2xl bg-[#F0F0FF] p-4 text-sm font-semibold leading-6 text-[#494BC8]">
                      {
                        intelligence
                          .advice
                          .recommendation
                      }
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {intelligence
                    .readiness
                    .checks
                    .map(
                      (
                        check,
                      ) => (
                        <div
                          key={
                            check.id
                          }
                          className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-3"
                        >
                          <Check
                            size={16}
                            className={
                              check.passed
                                ? "mt-0.5 text-emerald-600"
                                : "mt-0.5 text-amber-600"
                            }
                          />

                          <div>
                            <p className="text-sm font-black text-slate-800">
                              {
                                check.label
                              }
                            </p>

                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              {
                                check.message
                              }
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                </div>

                <button
                  type="button"
                  onClick={
                    handleAnalyze
                  }
                  disabled={
                    analyzing
                  }
                  className="w-full rounded-2xl border border-[#5D5FEF]/20 bg-white py-3.5 text-sm font-black text-[#5557D8] transition hover:bg-[#F8F8FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing
                    ? "Analizando…"
                    : "Volver a analizar"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={
                  handleAnalyze
                }
                disabled={
                  analyzing
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles
                    size={17}
                  />
                )}

                {analyzing
                  ? "Analizando evento…"
                  : "Analizar con Intelligence"}
              </button>
            )}
          </section>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {
              error
            }
          </div>
        ) : null}

        {isDraft ? (
          <button
            type="button"
            onClick={
              handlePublish
            }
            disabled={
              publishing ||
              analyzing
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <Check
                size={18}
              />
            )}

            {publishing
              ? "Publicando…"
              : "Publicar evento"}
          </button>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="font-black text-emerald-800">
              Evento publicado
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              Ya está preparado para entrar en el feed público de LookUp.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}