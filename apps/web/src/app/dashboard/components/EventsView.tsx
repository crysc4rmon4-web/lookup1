"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";

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
  onCreateEvent: () => void;
  onJoinEvent: (id: string) => void;
};

export function EventsView({
  events,
  onCreateEvent,
  onJoinEvent,
}: EventsViewProps) {
  return (
    <section className="space-y-5">

      <button
        onClick={onCreateEvent}
        className="w-full rounded-2xl bg-[#5D5FEF] py-4 font-bold text-white transition hover:opacity-90"
      >
        Crear evento
      </button>

      {events.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">

          <CalendarDays
            size={40}
            className="mx-auto text-[#5D5FEF]"
          />

          <h2 className="mt-5 text-2xl font-black">
            No hay eventos cerca
          </h2>

          <p className="mt-3 text-slate-500">
            Sé el primero en organizar una actividad.
          </p>

        </div>
      ) : (
        events.map((event) => (
          <article
            key={event.id}
            className="rounded-[2rem] bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-black">
              {event.title}
            </h2>

            <p className="mt-3 text-slate-500">
              {event.description}
            </p>

            <div className="mt-6 space-y-2 text-sm">

              <div className="flex items-center gap-2">
                <MapPin size={18} />
                {event.place}
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                {event.date}
              </div>

              <div className="flex items-center gap-2">
                <Users size={18} />
                {event.attendees} asistentes
              </div>

            </div>

            <button
              onClick={() => onJoinEvent(event.id)}
              className="mt-6 w-full rounded-xl bg-[#5D5FEF] py-3 font-bold text-white"
            >
              Participar
            </button>
          </article>
        ))
      )}
    </section>
  );
}