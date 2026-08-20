"use client";

import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import type {
  CreatedEventDraft,
} from "@/lib/events/event-domain";

export type EventCard = {
  id: string;
  title: string;
  description: string;
  place: string;
  date: string;
  attendees: number;
};

type EventsViewProps = {
  events: EventCard[];

  city?: string | null;

  createdDraft?: CreatedEventDraft | null;

  onCreateEvent: () => void;

  onJoinEvent: (
    id: string,
  ) => void;
};

function formatDraftDate(
  value: string,
) {
  const date =
    new Date(value);

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
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "Europe/Madrid",
    },
  ).format(date);
}

export function EventsView({
  events,
  city,
  createdDraft = null,
  onCreateEvent,
  onJoinEvent,
}: EventsViewProps) {
  const normalizedCity =
    city?.trim() ||
    "tu ciudad";

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
                {normalizedCity}
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
              Encuentra experiencias que encajen contigo o crea algo que merezca ser descubierto por las personas adecuadas.
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

      {createdDraft ? (
        <article className="overflow-hidden rounded-[2rem] border border-emerald-200/80 bg-white shadow-sm">
          <div className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2
                  size={20}
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">
                  Borrador guardado
                </p>

                <p className="mt-0.5 text-sm font-bold text-emerald-950">
                  El evento ya existe en LookUp.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {createdDraft.title}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
              {createdDraft.description}
            </p>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-[#5D5FEF]"
                />

                <div>
                  <p className="font-black text-slate-900">
                    {createdDraft.venueName}
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    {createdDraft.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
                <CalendarDays
                  size={17}
                  className="mt-0.5 shrink-0 text-[#5D5FEF]"
                />

                <div>
                  <p className="font-black text-slate-900">
                    {formatDraftDate(
                      createdDraft.startAt,
                    )}
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Estado: borrador
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F0F0FF] px-4 py-3.5">
              <Sparkles
                size={17}
                className="mt-0.5 shrink-0 text-[#5D5FEF]"
              />

              <div>
                <p className="text-sm font-black text-[#494BC8]">
                  Siguiente: LookUp Intelligence
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                  En el siguiente bloque analizaremos la preparación del evento y su potencial local antes de publicarlo.
                </p>
              </div>
            </div>
          </div>
        </article>
      ) : null}

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
            El descubrimiento inteligente por ciudad, intereses e intención se conectará sobre esta misma experiencia.
          </p>

          {!createdDraft ? (
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

              Crear el primer evento
            </button>
          ) : null}
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
                      size={
                        18
                      }
                      className="text-[#5D5FEF]"
                    />

                    {
                      event.place
                    }
                  </div>

                  <div className="flex items-center gap-2.5">
                    <CalendarDays
                      size={
                        18
                      }
                      className="text-[#5D5FEF]"
                    />

                    {
                      event.date
                    }
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Users
                      size={
                        18
                      }
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
    </section>
  );
}