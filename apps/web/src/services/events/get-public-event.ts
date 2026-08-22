import type {
  PublicEvent,
} from "@/lib/events/public-event";

type PublicEventResponse = {
  event?:
    PublicEvent;

  error?:
    string;
};

type GetPublicEventInput = {
  accessToken:
    string;

  eventId:
    string;

  signal?:
    AbortSignal;
};

export async function getPublicEvent({
  accessToken,
  eventId,
  signal,
}: GetPublicEventInput): Promise<
  PublicEvent
> {
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
      `/api/events/${encodeURIComponent(
        eventId.trim(),
      )}`,
      requestInit,
    );

  const payload =
    (await response.json()) as PublicEventResponse;

  if (
    !response.ok ||
    !payload.event
  ) {
    throw new Error(
      payload.error ??
        "No se pudo cargar el evento.",
    );
  }

  return payload.event;
}

export type {
  PublicEvent,
};