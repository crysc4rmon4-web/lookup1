import type {
  CreatedEventDraft,
  EventDraftCreateInput,
} from "@/lib/events/event-domain";

type ErrorResponse = {
  error?: string;
};

type CreateEventDraftResponse = {
  draft?: unknown;
};

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNullableString(
  value: unknown,
): value is string | null {
  return (
    typeof value ===
      "string" ||
    value === null
  );
}

function isNullableNumber(
  value: unknown,
): value is number | null {
  return (
    (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    ) ||
    value === null
  );
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item ===
        "string",
    )
  );
}

function isCreatedEventDraft(
  value: unknown,
): value is CreatedEventDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.creatorProfileId ===
      "string" &&

    typeof value.title ===
      "string" &&
    typeof value.description ===
      "string" &&
    typeof value.category ===
      "string" &&

    isStringArray(
      value.tags,
    ) &&
    isStringArray(
      value.audience,
    ) &&

    typeof value.venueName ===
      "string" &&
    typeof value.address ===
      "string" &&

    typeof value.city ===
      "string" &&
    typeof value.cityKey ===
      "string" &&

    typeof value.province ===
      "string" &&
    isNullableString(
      value.postalCode,
    ) &&

    typeof value.countryCode ===
      "string" &&

    typeof value.latitude ===
      "number" &&
    Number.isFinite(
      value.latitude,
    ) &&

    typeof value.longitude ===
      "number" &&
    Number.isFinite(
      value.longitude,
    ) &&

    typeof value.startAt ===
      "string" &&
    typeof value.endAt ===
      "string" &&

    value.status ===
      "draft" &&

    typeof value.isFree ===
      "boolean" &&
    isNullableNumber(
      value.priceFrom,
    ) &&

    typeof value.currency ===
      "string" &&

    isNullableString(
      value.externalUrl,
    ) &&
    isNullableString(
      value.externalActionLabel,
    ) &&

    isNullableNumber(
      value.capacity,
    ) &&

    typeof value.createdAt ===
      "string" &&
    typeof value.updatedAt ===
      "string"
  );
}

export async function createEventDraft(
  accessToken: string,
  input: EventDraftCreateInput,
): Promise<CreatedEventDraft> {
  const normalizedToken =
    accessToken.trim();

  if (!normalizedToken) {
    throw new Error(
      "No hay una sesión válida.",
    );
  }

  const response =
    await fetch(
      "/api/events/drafts",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${normalizedToken}`,

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

  const payload =
    (await response
      .json()
      .catch(
        () => ({}),
      )) as
      | CreateEventDraftResponse
      | ErrorResponse;

  if (!response.ok) {
    const message =
      "error" in
        payload &&
      typeof payload.error ===
        "string"
        ? payload.error
        : "No se pudo crear el evento.";

    throw new Error(
      message,
    );
  }

  if (
    !(
      "draft" in
      payload
    ) ||
    !isCreatedEventDraft(
      payload.draft,
    )
  ) {
    throw new Error(
      "LookUp no recibió un borrador válido del evento.",
    );
  }

  return payload.draft;
}