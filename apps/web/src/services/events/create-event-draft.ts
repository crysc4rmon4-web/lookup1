export type CreateEventDraftInput = {
  title: string;
  description: string;
  category: string;

  tags: string[];
  audience: string[];

  venueName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  startAt: string;
  endAt: string;

  isFree: boolean;
  priceFrom: number | null;

  externalUrl: string | null;
  externalActionLabel: string | null;

  capacity: number | null;
};

export type CreatedEventDraft = {
  id: string;

  title: string;
  description: string;

  category: string;

  venueName: string | null;

  address: string;
  city: string;
  cityKey: string;
  province: string | null;
  postalCode: string | null;

  latitude: number;
  longitude: number;

  tags: string[];
  audience: string[];

  startAt: string;
  endAt: string;

  status: "draft";

  isFree: boolean;
  priceFrom: number | null;

  externalUrl: string | null;
  externalActionLabel: string | null;

  capacity: number | null;
};

type CreateEventDraftResponse = {
  draft: CreatedEventDraft;
};

type ErrorResponse = {
  error?: string;
};

function normalizeRequiredText(
  value: string,
  fieldName: string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${fieldName} es obligatorio.`,
    );
  }

  return normalized;
}

function normalizeOptionalText(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function normalizeStringList(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean),
    ),
  );
}

function isCreatedEventDraft(
  value: unknown,
): value is CreatedEventDraft {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const draft =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof draft.id ===
      "string" &&
    typeof draft.title ===
      "string" &&
    typeof draft.city ===
      "string" &&
    typeof draft.cityKey ===
      "string" &&
    typeof draft.latitude ===
      "number" &&
    typeof draft.longitude ===
      "number" &&
    draft.status ===
      "draft"
  );
}

export async function createEventDraft(
  accessToken: string,
  input: CreateEventDraftInput,
): Promise<CreatedEventDraft> {
  const normalizedToken =
    accessToken.trim();

  if (!normalizedToken) {
    throw new Error(
      "No hay una sesión válida.",
    );
  }

  const title =
    normalizeRequiredText(
      input.title,
      "El título",
    );

  const description =
    normalizeRequiredText(
      input.description,
      "La descripción",
    );

  const category =
    normalizeRequiredText(
      input.category,
      "La categoría",
    );

  const venueName =
    normalizeRequiredText(
      input.venueName,
      "El lugar",
    );

  const address =
    normalizeRequiredText(
      input.address,
      "La dirección",
    );

  const city =
    normalizeRequiredText(
      input.city,
      "La ciudad",
    );

  const province =
    normalizeRequiredText(
      input.province,
      "La provincia",
    );

  const postalCode =
    normalizeRequiredText(
      input.postalCode,
      "El código postal",
    );

  const startAt =
    normalizeRequiredText(
      input.startAt,
      "La fecha de inicio",
    );

  const endAt =
    normalizeRequiredText(
      input.endAt,
      "La fecha de finalización",
    );

  if (
    Number.isNaN(
      Date.parse(startAt),
    )
  ) {
    throw new Error(
      "La fecha de inicio no es válida.",
    );
  }

  if (
    Number.isNaN(
      Date.parse(endAt),
    )
  ) {
    throw new Error(
      "La fecha de finalización no es válida.",
    );
  }

  if (
    Date.parse(endAt) <=
    Date.parse(startAt)
  ) {
    throw new Error(
      "La hora de finalización debe ser posterior a la de inicio.",
    );
  }

  const priceFrom =
    input.isFree
      ? null
      : input.priceFrom;

  if (
    !input.isFree &&
    (
      priceFrom ===
        null ||
      !Number.isFinite(
        priceFrom,
      ) ||
      priceFrom <
        0
    )
  ) {
    throw new Error(
      "Indica un precio válido para el evento.",
    );
  }

  if (
    input.capacity !==
      null &&
    (
      !Number.isInteger(
        input.capacity,
      ) ||
      input.capacity <=
        0
    )
  ) {
    throw new Error(
      "El aforo debe ser un número entero mayor que cero.",
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
          JSON.stringify({
            title,
            description,
            category,

            tags:
              normalizeStringList(
                input.tags,
              ),

            audience:
              normalizeStringList(
                input.audience,
              ),

            venueName,
            address,
            city,
            province,
            postalCode,

            startAt,
            endAt,

            isFree:
              input.isFree,

            priceFrom,

            externalUrl:
              normalizeOptionalText(
                input.externalUrl,
              ),

            externalActionLabel:
              normalizeOptionalText(
                input.externalActionLabel,
              ),

            capacity:
              input.capacity,
          }),

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