"use client";

import {
  Bookmark,
  RefreshCw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "@/components/auth-provider";

import {
  EventDiscoveryCard,
} from "@/components/events/EventDiscoveryCard";

import {
  getSavedEvents,
  type SavedEvent,
} from "@/services/events/get-saved-events";

type SavedEventsPanelProps = {
  onOpen: (
    eventId: string,
  ) => void;
};

export function SavedEventsPanel({
  onOpen,
}: SavedEventsPanelProps) {
  const {
    session,
  } =
    useAuth();

  const [
    events,
    setEvents,
  ] =
    useState<
      SavedEvent[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const loadEvents =
    useCallback(
      async (
        signal?:
          AbortSignal,
      ) => {
        const accessToken =
          session
            ?.access_token
            ?.trim();

        if (!accessToken) {
          setEvents(
            [],
          );

          setError(
            "Tu sesión no es válida.",
          );

          return;
        }

        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const result =
            signal
              ? await getSavedEvents(
                  accessToken,
                  signal,
                )
              : await getSavedEvents(
                  accessToken,
                );

          if (
            signal?.aborted
          ) {
            return;
          }

          setEvents(
            result,
          );
        } catch (
          loadError
        ) {
          if (
            signal?.aborted
          ) {
            return;
          }

          if (
            loadError instanceof
              DOMException &&
            loadError.name ===
              "AbortError"
          ) {
            return;
          }

          setEvents(
            [],
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "No se pudieron cargar tus eventos guardados.",
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false,
            );
          }
        }
      },
      [
        session
          ?.access_token,
      ],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadEvents(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [
    loadEvents,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
            Guardados
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {loading
              ? "Cargando eventos…"
              : `${events.length} evento${
                  events.length ===
                  1
                    ? ""
                    : "s"
                } guardado${
                  events.length ===
                  1
                    ? ""
                    : "s"
                }`}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadEvents()
          }
          disabled={
            loading
          }
          aria-label="Actualizar eventos guardados"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#5D5FEF] shadow-sm transition hover:border-[#5D5FEF]/30 hover:bg-[#F3F2FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
        </button>
      </div>

      {loading &&
      events.length ===
        0 ? (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <RefreshCw
            size={25}
            className="mx-auto animate-spin text-[#5D5FEF]"
          />

          <p className="mt-4 text-sm font-black text-slate-700">
            Cargando tus eventos guardados…
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-black text-rose-800">
            No pudimos cargar Guardados
          </p>

          <p className="mt-2 text-sm leading-6 text-rose-700">
            {
              error
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void loadEvents()
            }
            disabled={
              loading
            }
            className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading &&
      !error &&
      events.length ===
        0 ? (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
            <Bookmark
              size={29}
            />
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            Todavía no tienes eventos guardados
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Cuando guardes un evento desde Explorar o desde su ficha, aparecerá aquí.
          </p>
        </div>
      ) : null}

      {events.map(
        (
          event,
        ) => (
          <EventDiscoveryCard
            key={
              event.id
            }
            event={
              event
            }
            onOpen={
              onOpen
            }
            onFavoriteChange={(
              isFavorite,
            ) => {
              if (
                isFavorite
              ) {
                return;
              }

              setEvents(
                (
                  current,
                ) =>
                  current.filter(
                    (
                      currentEvent,
                    ) =>
                      currentEvent.id !==
                      event.id,
                  ),
              );
            }}
          />
        ),
      )}
    </div>
  );
}