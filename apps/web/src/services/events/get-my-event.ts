import type {
  MyEvent,
} from "./get-my-events";

type ResponsePayload = {
  event?: MyEvent;
  error?: string;
};

export async function getMyEvent(
  accessToken: string,
  eventId: string,
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
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      },
    );

  let payload:
    ResponsePayload | null =
    null;

  try {
    payload =
      (await response.json()) as ResponsePayload;
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
        "No se pudo cargar el evento.",
    );
  }

  return payload.event;
}