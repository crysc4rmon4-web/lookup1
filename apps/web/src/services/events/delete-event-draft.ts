type DeleteEventDraftResponse = {
  success?: boolean;

  eventId?: string;

  error?: string;
};

export async function deleteEventDraft(
  accessToken: string,
  eventId: string,
) {
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
          "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      },
    );

  let payload:
    DeleteEventDraftResponse | null =
    null;

  try {
    payload =
      (await response.json()) as DeleteEventDraftResponse;
  } catch {
    payload =
      null;
  }

  if (
    !response.ok ||
    !payload?.success
  ) {
    throw new Error(
      payload?.error ??
        "No se pudo eliminar el borrador.",
    );
  }

  return payload;
}