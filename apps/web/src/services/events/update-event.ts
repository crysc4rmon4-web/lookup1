import type {
  EventDraftCreateInput,
} from "@/lib/events/event-domain";

import type {
  MyEvent,
} from "@/services/events/get-my-events";

type UpdateEventResponse = {
  event?: MyEvent;

  intelligenceInvalidated?: boolean;

  error?: string;
};

export async function updateEvent(
  accessToken: string,
  eventId: string,
  input: EventDraftCreateInput,
): Promise<MyEvent> {
  const token =
    accessToken.trim();

  const id =
    eventId.trim();

  if (!token) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  if (!id) {
    throw new Error(
      "El evento solicitado no es válido.",
    );
  }

  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        id,
      )}`,
      {
        method:
          "PATCH",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            input,
          ),

        cache:
          "no-store",
      },
    );

  let payload:
    UpdateEventResponse | null =
    null;

  try {
    payload =
      (await response.json()) as UpdateEventResponse;
  } catch {
    payload =
      null;
  }

  if (
    !response.ok ||
    !payload?.event
  ) {
    throw new Error(
      payload?.error ??
        "No se pudo actualizar el evento.",
    );
  }

  return payload.event;
}