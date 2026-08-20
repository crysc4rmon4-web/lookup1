import type {
  EventDraftIntelligenceResult,
} from "@/lib/events/event-intelligence-types";

type ResponsePayload = {
  intelligence?:
    EventDraftIntelligenceResult | null;

  error?:
    string;
};

export async function getSavedEventIntelligence(
  accessToken: string,
  eventId: string,
): Promise<EventDraftIntelligenceResult | null> {
  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        eventId,
      )}/intelligence`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  const payload =
    (await response.json()) as ResponsePayload;

  if (!response.ok) {
    throw new Error(
      payload.error ??
        "No se pudo recuperar Intelligence.",
    );
  }

  return (
    payload.intelligence ??
    null
  );
}