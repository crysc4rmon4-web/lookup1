import type {
  EventDraftIntelligenceResult,
} from "@/lib/events/event-intelligence-types";

type ErrorResponse = {
  error?: string;
};

export async function getEventDraftIntelligence(
  accessToken: string,
  eventId: string,
): Promise<EventDraftIntelligenceResult> {
  const normalizedToken =
    accessToken.trim();

  const normalizedEventId =
    eventId.trim();

  if (!normalizedToken) {
    throw new Error(
      "No hay una sesión válida.",
    );
  }

  if (!normalizedEventId) {
    throw new Error(
      "El evento no es válido.",
    );
  }

  const response =
    await fetch(
      `/api/events/drafts/${encodeURIComponent(
        normalizedEventId,
      )}/intelligence`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${normalizedToken}`,
        },

        cache:
          "no-store",
      },
    );

  const payload =
    (await response
      .json()
      .catch(
        () => ({}),
      )) as
      | EventDraftIntelligenceResult
      | ErrorResponse;

  if (!response.ok) {
    const message =
      "error" in
        payload &&
      typeof payload.error ===
        "string"
        ? payload.error
        : "No se pudo analizar el evento.";

    throw new Error(
      message,
    );
  }

  if (
    !(
      "eventId" in
      payload
    )
  ) {
    throw new Error(
      "LookUp no recibió un análisis válido del evento.",
    );
  }

  return payload;
}