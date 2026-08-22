export type EventFavoriteState = {
  isFavorite:
    boolean;

  canFavorite:
    boolean;

  reason:
    "own_event" |
    "ended" |
    null;
};

type FavoriteResponse = {
  isFavorite?:
    boolean;

  canFavorite?:
    boolean;

  reason?:
    "own_event" |
    "ended" |
    null;

  error?:
    string;
};

async function requestFavorite(
  accessToken: string,
  eventId: string,
  method:
    | "GET"
    | "POST"
    | "DELETE",
) {
  const response =
    await fetch(
      `/api/events/${encodeURIComponent(
        eventId.trim(),
      )}/favorite`,
      {
        method,

        headers: {
          Authorization:
            `Bearer ${accessToken.trim()}`,
        },

        cache:
          "no-store",
      },
    );

  const payload =
    (await response.json()) as FavoriteResponse;

  if (!response.ok) {
    throw new Error(
      payload.error ??
        "No se pudo actualizar Guardados.",
    );
  }

  return payload;
}

export async function getEventFavoriteState(
  accessToken: string,
  eventId: string,
): Promise<EventFavoriteState> {
  const payload =
    await requestFavorite(
      accessToken,
      eventId,
      "GET",
    );

  return {
    isFavorite:
      payload.isFavorite ??
      false,

    canFavorite:
      payload.canFavorite ??
      false,

    reason:
      payload.reason ??
      null,
  };
}

export async function saveEventFavorite(
  accessToken: string,
  eventId: string,
) {
  await requestFavorite(
    accessToken,
    eventId,
    "POST",
  );
}

export async function removeEventFavorite(
  accessToken: string,
  eventId: string,
) {
  await requestFavorite(
    accessToken,
    eventId,
    "DELETE",
  );
}