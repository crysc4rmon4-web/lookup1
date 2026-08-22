"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  CircleAlert,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/components/auth-provider";

import {
  EditEventForm,
} from "@/app/dashboard/components/EditEventForm";

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

type ConfirmAction =
  | "publish"
  | "delete"
  | "cancel"
  | null;

type ApiActionResponse = {
  success?: boolean;

  eventId?: string;

  event?: {
    id?: string;
    status?: string;
    updatedAt?: string;
  };

  error?: string;
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

function getActionErrorMessage(
  payload:
    ApiActionResponse | null,
  fallback: string,
) {
  return (
    payload?.error ??
    fallback
  );
}

async function deleteEventDraft(
  accessToken: string,
  eventId: string,
) {
  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        eventId,
      )}`,
      {
        method:
          "DELETE",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  let payload:
    ApiActionResponse | null =
    null;

  try {
    payload =
      (await response.json()) as ApiActionResponse;
  } catch {
    payload =
      null;
  }

  if (!response.ok) {
    throw new Error(
      getActionErrorMessage(
        payload,
        "No se pudo eliminar el borrador.",
      ),
    );
  }

  return payload;
}

async function cancelPublishedEvent(
  accessToken: string,
  eventId: string,
) {
  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        eventId,
      )}/cancel`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  let payload:
    ApiActionResponse | null =
    null;

  try {
    payload =
      (await response.json()) as ApiActionResponse;
  } catch {
    payload =
      null;
  }

  if (!response.ok) {
    throw new Error(
      getActionErrorMessage(
        payload,
        "No se pudo cancelar el evento.",
      ),
    );
  }

  return payload;
}

function ConfirmationDialog({
  action,
  eventTitle,
  loading,
  onCancel,
  onConfirm,
}: {
  action: Exclude<
    ConfirmAction,
    null
  >;

  eventTitle: string;

  loading: boolean;

  onCancel: () => void;

  onConfirm: () => void;
}) {
  const content =
    action ===
      "delete"
      ? {
        icon:
          Trash2,

        eyebrow:
          "Eliminar borrador",

        title:
          "¿Eliminar definitivamente este borrador?",

        description:
          `“${eventTitle}” desaparecerá de LookUp junto con sus análisis asociados. Esta acción no se puede deshacer.`,

        confirmLabel:
          "Eliminar borrador",

        confirmClass:
          "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",

        iconClass:
          "bg-rose-50 text-rose-600",
      }
      : action ===
        "cancel"
        ? {
          icon:
            Ban,

          eyebrow:
            "Cancelar evento",

          title:
            "¿Cancelar este evento?",

          description:
            `“${eventTitle}” dejará de estar activo como evento disponible. Conservaremos el registro para que siga formando parte de tu historial.`,

          confirmLabel:
            "Cancelar evento",

          confirmClass:
            "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20",

          iconClass:
            "bg-rose-50 text-rose-600",
        }
        : {
          icon:
            Check,

          eyebrow:
            "Publicar evento",

          title:
            "¿Listo para hacerlo visible?",

          description:
            `“${eventTitle}” pasará de borrador a evento publicado y quedará preparado para aparecer en la experiencia pública de LookUp.`,

          confirmLabel:
            "Publicar evento",

          confirmClass:
            "bg-[#5D5FEF] hover:bg-[#5254DF] shadow-[#5D5FEF]/20",

          iconClass:
            "bg-[#F0F0FF] text-[#5D5FEF]",
        };

  const Icon =
    content.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${content.iconClass}`}
            >
              <Icon
                size={22}
              />
            </div>

            <button
              type="button"
              aria-label="Cerrar confirmación"
              disabled={
                loading
              }
              onClick={
                onCancel
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X
                size={19}
              />
            </button>
          </div>

          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
            {
              content.eyebrow
            }
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            {
              content.title
            }
          </h2>

          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            {
              content.description
            }
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-[#FAFBFD] p-4 sm:p-5">
          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              loading
            }
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              loading
            }
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${content.confirmClass}`}
          >
            {loading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Icon
                size={17}
              />
            )}

            {loading
              ? "Procesando…"
              : content.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
function normalizeAdviceText(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "es",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function shouldShowRecommendation(
  message: string,
  recommendation:
    | string
    | null,
) {
  if (
    !recommendation?.trim()
  ) {
    return false;
  }

  const normalizedMessage =
    normalizeAdviceText(
      message,
    );

  const normalizedRecommendation =
    normalizeAdviceText(
      recommendation,
    );

  if (
    !normalizedRecommendation
  ) {
    return false;
  }

  return (
    !normalizedMessage.includes(
      normalizedRecommendation,
    ) &&
    !normalizedRecommendation.includes(
      normalizedMessage,
    )
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
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    cancelling,
    setCancelling,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState(false);

  const [
    confirmAction,
    setConfirmAction,
  ] =
    useState<ConfirmAction>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    successMessage,
    setSuccessMessage,
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
        } catch (
        loadError
        ) {
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

  function goToMyEvents() {
    router.push(
      "/dashboard?section=events&eventsTab=mine",
    );
  }

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

    setSuccessMessage(
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

      setSuccessMessage(
        "LookUp Intelligence ha actualizado el análisis de este borrador.",
      );
    } catch (
    analysisError
    ) {
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

  async function executePublish() {
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

    setConfirmAction(
      null,
    );

    setPublishing(
      true,
    );

    setError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await publishEventDraft(
        token,
        event.id,
      );

      await loadEvent();

      setSuccessMessage(
        "El evento se publicó correctamente.",
      );
    } catch (
    publishError
    ) {
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

  async function executeDelete() {
    const token =
      session
        ?.access_token;

    if (
      !token ||
      !event ||
      deleting
    ) {
      return;
    }

    setConfirmAction(
      null,
    );

    setDeleting(
      true,
    );

    setError(
      null,
    );

    try {
      await deleteEventDraft(
        token,
        event.id,
      );

      router.replace(
        "/dashboard?section=events&eventsTab=mine",
      );

      router.refresh();
    } catch (
    deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "No se pudo eliminar el borrador.",
      );

      setDeleting(
        false,
      );
    }
  }

  async function executeCancel() {
    const token =
      session
        ?.access_token;

    if (
      !token ||
      !event ||
      cancelling
    ) {
      return;
    }

    setConfirmAction(
      null,
    );

    setCancelling(
      true,
    );

    setError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await cancelPublishedEvent(
        token,
        event.id,
      );

      await loadEvent();

      setSuccessMessage(
        "El evento se canceló correctamente.",
      );
    } catch (
    cancelError
    ) {
      setError(
        cancelError instanceof
          Error
          ? cancelError.message
          : "No se pudo cancelar el evento.",
      );
    } finally {
      setCancelling(
        false,
      );
    }
  }

  function handleEditSaved(
    updatedEvent:
      MyEvent,
  ) {
    setEvent(
      updatedEvent,
    );

    /*
     * La API invalida el análisis anterior porque
     * pertenece a una versión distinta del evento.
     */
    if (
      updatedEvent.lifecycleStatus ===
      "draft"
    ) {
      setIntelligence(
        null,
      );
    }

    setEditing(
      false,
    );

    setError(
      null,
    );

    setSuccessMessage(
      updatedEvent.lifecycleStatus ===
        "draft"
        ? "Los cambios se guardaron. Vuelve a analizar el borrador antes de publicarlo."
        : "Los cambios del evento se guardaron correctamente.",
    );
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
            {error ??
              "El evento no está disponible."}
          </p>

          <button
            type="button"
            onClick={
              goToMyEvents
            }
            className="mt-6 rounded-2xl bg-[#5D5FEF] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20"
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

  const showIntelligenceRecommendation =
    intelligence
      ? shouldShowRecommendation(
        intelligence.advice.message,
        intelligence.advice.recommendation,
      )
      : false;

  const isUpcoming =
    event.lifecycleStatus ===
    "upcoming";

  const isLive =
    event.lifecycleStatus ===
    "live";

  const isEnded =
    event.lifecycleStatus ===
    "ended";

  const isCancelled =
    event.lifecycleStatus ===
    "cancelled";

  const canEdit =
    isDraft ||
    isUpcoming;


  const actionBusy =
    analyzing ||
    publishing ||
    deleting ||
    cancelling;

  return (
    <>
      <main className="min-h-screen bg-[#F7F8FC] px-4 py-5 pb-12">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={
                goToMyEvents
              }
              className="inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-black text-[#5D5FEF] transition hover:text-[#4F51D8]"
            >
              <ArrowLeft
                size={18}
              />

              Mis eventos
            </button>

            {canEdit ? (
              <button
                type="button"
                onClick={() =>
                  setEditing(
                    true,
                  )
                }
                disabled={
                  actionBusy
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-[#5D5FEF]/15 bg-white px-4 py-2.5 text-sm font-black text-[#5557D8] shadow-sm transition hover:border-[#5D5FEF]/30 hover:bg-[#F8F8FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil
                  size={16}
                />

                Editar
              </button>
            ) : null}
          </div>

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

          {successMessage ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800"
            >
              <Check
                size={18}
                className="mt-0.5 shrink-0"
              />

              {
                successMessage
              }
            </div>
          ) : null}

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

                {event.postalCode ? (
                  <p className="text-sm text-slate-400">
                    {
                      event.postalCode
                    }
                  </p>
                ) : null}
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
                    Analizamos la preparación del evento antes de publicarlo. Intelligence asesora; la decisión final siempre sigue siendo tuya.
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

                    {showIntelligenceRecommendation &&
                      intelligence.advice.recommendation ? (
                      <div className="mt-3 rounded-2xl border border-[#5D5FEF]/10 bg-[#F0F0FF] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5D5FEF]">
                          Recomendación
                        </p>

                        <p className="mt-1.5 text-sm font-semibold leading-6 text-[#494BC8]">
                          {
                            intelligence
                              .advice
                              .recommendation
                          }
                        </p>
                      </div>
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
                                  ? "mt-0.5 shrink-0 text-emerald-600"
                                  : "mt-0.5 shrink-0 text-amber-600"
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
                      analyzing ||
                      publishing ||
                      deleting
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
                    analyzing ||
                    deleting
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
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700"
            >
              <CircleAlert
                size={18}
                className="mt-0.5 shrink-0"
              />

              {
                error
              }
            </div>
          ) : null}

          {isDraft ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#5D5FEF]">
                Gestión
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Tu borrador
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Puedes seguir modificándolo, analizarlo y publicarlo cuando esté preparado.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      true,
                    )
                  }
                  disabled={
                    actionBusy
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#5D5FEF]/20 bg-[#F8F8FF] px-5 py-3.5 text-sm font-black text-[#5557D8] transition hover:bg-[#F0F0FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil
                    size={17}
                  />

                  Editar borrador
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction(
                      "publish",
                    )
                  }
                  disabled={
                    actionBusy
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF] disabled:cursor-not-allowed disabled:opacity-50"
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

                  Publicar evento
                </button>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction(
                      "delete",
                    )
                  }
                  disabled={
                    actionBusy
                  }
                  className="inline-flex items-center gap-2 text-sm font-black text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2
                    size={16}
                  />

                  Eliminar borrador
                </button>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Los borradores sí pueden eliminarse definitivamente porque todavía no han sido publicados.
                </p>
              </div>
            </section>
          ) : null}

          {isUpcoming ? (
            <section className="rounded-[2rem] border border-[#5D5FEF]/15 bg-[#F8F8FF] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
                  <Check
                    size={20}
                  />
                </div>

                <div>
                  <p className="text-sm font-black text-[#494BC8]">
                    Evento publicado
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Está preparado para participar en la experiencia pública de LookUp. Mientras no haya comenzado todavía puedes editarlo.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      true,
                    )
                  }
                  disabled={
                    actionBusy
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil
                    size={17}
                  />

                  Editar evento
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction(
                      "cancel",
                    )
                  }
                  disabled={
                    actionBusy
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Ban
                    size={17}
                  />

                  Cancelar evento
                </button>
              </div>
            </section>
          ) : null}

          {isLive ? (
            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
              <p className="font-black text-emerald-800">
                Evento en curso
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                El evento ya comenzó. Sus datos principales quedan protegidos para no modificar una experiencia que ya está sucediendo.
              </p>

              <button
                type="button"
                onClick={() =>
                  setConfirmAction(
                    "cancel",
                  )
                }
                disabled={
                  actionBusy
                }
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
              >
                <Ban
                  size={16}
                />

                Cancelar evento
              </button>
            </section>
          ) : null}

          {isEnded ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6">
              <CalendarDays
                size={24}
                className="mx-auto text-[#5D5FEF]"
              />

              <p className="mt-3 font-black text-slate-900">
                Evento finalizado
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                El evento permanece en tu historial. Más adelante LookUp Intelligence utilizará aquí sus resultados reales para ayudarte a entender qué funcionó.
              </p>
            </section>
          ) : null}

          {isCancelled ? (
            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-center sm:p-6">
              <Ban
                size={24}
                className="mx-auto text-amber-600"
              />

              <p className="mt-3 font-black text-amber-900">
                Evento cancelado
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Ya no está activo como evento disponible, pero se conserva en tu historial.
              </p>
            </section>
          ) : null}
        </div>
      </main>

      {editing &&
        session?.access_token &&
        canEdit ? (
        <EditEventForm
          accessToken={
            session.access_token
          }
          event={
            event
          }
          onSaved={
            handleEditSaved
          }
          onClose={() =>
            setEditing(
              false,
            )
          }
        />
      ) : null}

      {confirmAction ? (
        <ConfirmationDialog
          action={
            confirmAction
          }
          eventTitle={
            event.title
          }
          loading={
            confirmAction ===
              "publish"
              ? publishing
              : confirmAction ===
                "delete"
                ? deleting
                : cancelling
          }
          onCancel={() => {
            if (
              !publishing &&
              !deleting &&
              !cancelling
            ) {
              setConfirmAction(
                null,
              );
            }
          }}
          onConfirm={() => {
            if (
              confirmAction ===
              "publish"
            ) {
              void executePublish();

              return;
            }

            if (
              confirmAction ===
              "delete"
            ) {
              void executeDelete();

              return;
            }

            void executeCancel();
          }}
        />
      ) : null}
    </>
  );
}