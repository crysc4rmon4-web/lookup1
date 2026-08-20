type PublishResponse = {
  event?: {
    id: string;
    status: string;
    updatedAt: string;
  };

  error?: string;
};

export async function publishEventDraft(
  accessToken: string,
  eventId: string,
) {
  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        eventId,
      )}/publish`,
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

  const payload =
    (await response.json()) as PublishResponse;

  if (
    !response.ok ||
    !payload.event
  ) {
    throw new Error(
      payload.error ??
        "No se pudo publicar el evento.",
    );
  }

  return payload.event;
}