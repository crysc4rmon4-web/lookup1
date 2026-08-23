export type EventRelevanceLevel =
  | "strong"
  | "good"
  | "exploratory"
  | "low";

export type EventMatchUnavailableReason =
  | "own_event"
  | "ended"
  | "missing_profile_context"
  | "temporarily_unavailable";

export type EventMatchExplanationResult = {
  available:
    boolean;

  relevanceScore:
    number | null;

  relevanceLevel:
    EventRelevanceLevel | null;

  matchedInterests:
    string[];

  explanation:
    string | null;

  source:
    | "ai"
    | "fallback"
    | "unavailable";

  model:
    string | null;

  reason:
    EventMatchUnavailableReason | null;
};

type EventMatchExplanationResponse =
  Partial<EventMatchExplanationResult> & {
    error?:
      string;
  };

type GetEventMatchExplanationInput = {
  accessToken:
    string;

  eventId:
    string;

  signal?:
    AbortSignal;
};

export async function getEventMatchExplanation({
  accessToken,
  eventId,
  signal,
}: GetEventMatchExplanationInput): Promise<EventMatchExplanationResult> {
  const normalizedToken =
    accessToken.trim();

  const normalizedEventId =
    eventId.trim();

  if (
    !normalizedToken
  ) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  if (
    !normalizedEventId
  ) {
    throw new Error(
      "El evento solicitado no es válido.",
    );
  }

  const requestInit:
    RequestInit = {
    method:
      "POST",

    headers: {
      Authorization:
        `Bearer ${normalizedToken}`,

      "Content-Type":
        "application/json",
    },

    cache:
      "no-store",

    body:
      JSON.stringify({
        eventId:
          normalizedEventId,
      }),
  };

  if (
    signal
  ) {
    requestInit.signal =
      signal;
  }

  const response =
    await fetch(
      "/api/ai/event-match/explain",
      requestInit,
    );

  let payload:
    EventMatchExplanationResponse | null =
    null;

  try {
    payload =
      (await response.json()) as
        EventMatchExplanationResponse;
  } catch {
    payload =
      null;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error ??
      "No se pudo analizar este evento.",
    );
  }

  return {
    available:
      payload?.available ===
      true,

    relevanceScore:
      typeof payload
        ?.relevanceScore ===
        "number"
        ? payload.relevanceScore
        : null,

    relevanceLevel:
      payload
        ?.relevanceLevel ??
      null,

    matchedInterests:
      Array.isArray(
        payload
          ?.matchedInterests,
      )
        ? payload.matchedInterests.filter(
            (
              interest,
            ): interest is string =>
              typeof interest ===
              "string",
          )
        : [],

    explanation:
      typeof payload
        ?.explanation ===
        "string"
        ? payload.explanation
        : null,

    source:
      payload?.source ===
        "ai" ||
      payload?.source ===
        "fallback"
        ? payload.source
        : "unavailable",

    model:
      typeof payload
        ?.model ===
        "string"
        ? payload.model
        : null,

    reason:
      payload
        ?.reason ??
      null,
  };
}