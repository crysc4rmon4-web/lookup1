type CancelEventResponse = {
  event?: {
    id: string;

    status: string;

    updatedAt: string;
  };

  error?: string;
};

export async function cancelEvent(
  accessToken: string,
  eventId: string,
) {
  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        eventId,
      )}/cancel`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  let payload:
    CancelEventResponse | null =
    null;

  try {
    payload =
      (await response.json()) as CancelEventResponse;
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
        "No se pudo cancelar el evento.",
    );
  }

  return payload.event;
}