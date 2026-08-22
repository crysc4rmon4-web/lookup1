import type {
  PublicEvent,
} from "@/lib/events/public-event";

export type SavedEvent =
  PublicEvent & {
    savedAt:
      string;

    isFavorite:
      boolean;

    canFavorite:
      boolean;
  };

type SavedEventsResponse = {
  events?:
    SavedEvent[];

  count?:
    number;

  error?:
    string;
};

export async function getSavedEvents(
  accessToken: string,
  signal?: AbortSignal,
): Promise<SavedEvent[]> {
  const requestInit:
    RequestInit = {
    method:
      "GET",

    headers: {
      Authorization:
        `Bearer ${accessToken.trim()}`,
    },

    cache:
      "no-store",
  };

  if (signal) {
    requestInit.signal =
      signal;
  }

  const response =
    await fetch(
      "/api/events/saved",
      requestInit,
    );

  const payload =
    (await response.json()) as SavedEventsResponse;

  if (!response.ok) {
    throw new Error(
      payload.error ??
        "No se pudieron cargar tus eventos guardados.",
    );
  }

  return Array.isArray(
    payload.events,
  )
    ? payload.events
    : [];
}