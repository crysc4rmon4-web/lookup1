export const EVENT_LIMITS = {
  titleMin: 3,
  titleMax: 120,

  descriptionMin: 30,
  descriptionMax: 3000,

  venueNameMin: 2,
  venueNameMax: 160,

  addressMin: 3,
  addressMax: 300,

  cityMin: 2,
  cityMax: 120,

  provinceMin: 2,
  provinceMax: 120,

  postalCodeMax: 16,

  tagMax: 40,
  tagsMax: 10,

  audienceMax: 40,
  audiencesMax: 8,

  externalActionLabelMax: 60,

  capacityMax: 1_000_000,
} as const;

export type EventDraftCreateInput = {
  title: string;
  description: string;
  category: string;

  tags: string[];
  audience: string[];

  venueName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;

  startAt: string;
  endAt: string;

  isFree: boolean;
  priceFrom: number | null;

  externalUrl: string | null;
  externalActionLabel: string | null;

  capacity: number | null;
};

export type ParsedEventDraftCreateInput = {
  title: string;
  description: string;
  category: string;

  tags: string[];
  audience: string[];

  venueName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;

  startAt: Date;
  endAt: Date;

  isFree: boolean;
  priceFrom: number | null;

  externalUrl: string | null;
  externalActionLabel: string | null;

  capacity: number | null;
};

export type CreatedEventDraft = {
  id: string;
  creatorProfileId: string;

  title: string;
  description: string;
  category: string;

  tags: string[];
  audience: string[];

  venueName: string;
  address: string;

  city: string;
  cityKey: string;

  province: string;
  postalCode: string | null;

  countryCode: string;

  latitude: number;
  longitude: number;

  startAt: string;
  endAt: string;

  status: "draft";

  isFree: boolean;
  priceFrom: number | null;
  currency: string;

  externalUrl: string | null;
  externalActionLabel: string | null;

  capacity: number | null;

  createdAt: string;
  updatedAt: string;
};

export class EventValidationError extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "EventValidationError";
  }
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function cleanText(
  value: string,
) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function getRequiredString(
  record: Record<
    string,
    unknown
  >,
  key: string,
  label: string,
  minimum: number,
  maximum: number,
) {
  const value =
    record[key];

  if (
    typeof value !==
    "string"
  ) {
    throw new EventValidationError(
      `${label} es obligatorio.`,
    );
  }

  const normalized =
    cleanText(value);

  if (
    normalized.length <
    minimum
  ) {
    throw new EventValidationError(
      `${label} debe tener al menos ${minimum} caracteres.`,
    );
  }

  if (
    normalized.length >
    maximum
  ) {
    throw new EventValidationError(
      `${label} no puede superar ${maximum} caracteres.`,
    );
  }

  return normalized;
}

function getOptionalString(
  record: Record<
    string,
    unknown
  >,
  key: string,
  maximum: number,
) {
  const value =
    record[key];

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new EventValidationError(
      `${key} no es válido.`,
    );
  }

  const normalized =
    cleanText(value);

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
    maximum
  ) {
    throw new EventValidationError(
      `${key} no puede superar ${maximum} caracteres.`,
    );
  }

  return normalized;
}

function getStringList(
  record: Record<
    string,
    unknown
  >,
  key: string,
  maximumItems: number,
  maximumLength: number,
) {
  const value =
    record[key];

  if (
    value === null ||
    value === undefined
  ) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new EventValidationError(
      `${key} no es válido.`,
    );
  }

  const normalized =
    value
      .map((item) => {
        if (
          typeof item !==
          "string"
        ) {
          throw new EventValidationError(
            `${key} contiene un valor no válido.`,
          );
        }

        return cleanText(
          item,
        );
      })
      .filter(Boolean);

  const unique: string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const item of
    normalized
  ) {
    if (
      item.length >
      maximumLength
    ) {
      throw new EventValidationError(
        `Cada valor de ${key} puede tener como máximo ${maximumLength} caracteres.`,
      );
    }

    const comparable =
      item.toLocaleLowerCase(
        "es",
      );

    if (
      seen.has(
        comparable,
      )
    ) {
      continue;
    }

    seen.add(
      comparable,
    );

    unique.push(
      item,
    );
  }

  if (
    unique.length >
    maximumItems
  ) {
    throw new EventValidationError(
      `${key} admite como máximo ${maximumItems} valores.`,
    );
  }

  return unique;
}

function getBoolean(
  record: Record<
    string,
    unknown
  >,
  key: string,
  fallback: boolean,
) {
  const value =
    record[key];

  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value !==
    "boolean"
  ) {
    throw new EventValidationError(
      `${key} no es válido.`,
    );
  }

  return value;
}

function getNullableNumber(
  record: Record<
    string,
    unknown
  >,
  key: string,
) {
  const value =
    record[key];

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numberValue =
    typeof value ===
    "number"
      ? value
      : typeof value ===
          "string"
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isFinite(
      numberValue,
    )
  ) {
    throw new EventValidationError(
      `${key} no es válido.`,
    );
  }

  return numberValue;
}

function parseDate(
  record: Record<
    string,
    unknown
  >,
  key: string,
  label: string,
) {
  const value =
    record[key];

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new EventValidationError(
      `${label} es obligatorio.`,
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new EventValidationError(
      `${label} no es válida.`,
    );
  }

  return date;
}

function validateExternalUrl(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  let url: URL;

  try {
    url =
      new URL(value);
  } catch {
    throw new EventValidationError(
      "El enlace externo no es válido.",
    );
  }

  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new EventValidationError(
      "El enlace externo debe comenzar por http:// o https://.",
    );
  }

  return url.toString();
}

export function parseEventDraftCreateInput(
  value: unknown,
  now = new Date(),
): ParsedEventDraftCreateInput {
  if (!isRecord(value)) {
    throw new EventValidationError(
      "Los datos del evento no son válidos.",
    );
  }

  const title =
    getRequiredString(
      value,
      "title",
      "El título",
      EVENT_LIMITS.titleMin,
      EVENT_LIMITS.titleMax,
    );

  const description =
    getRequiredString(
      value,
      "description",
      "La descripción",
      EVENT_LIMITS.descriptionMin,
      EVENT_LIMITS.descriptionMax,
    );

  const category =
    getRequiredString(
      value,
      "category",
      "La categoría",
      2,
      60,
    ).toLowerCase();

  if (
    !/^[a-z0-9-]+$/.test(
      category,
    )
  ) {
    throw new EventValidationError(
      "La categoría no es válida.",
    );
  }

  const tags =
    getStringList(
      value,
      "tags",
      EVENT_LIMITS.tagsMax,
      EVENT_LIMITS.tagMax,
    );

  const audience =
    getStringList(
      value,
      "audience",
      EVENT_LIMITS.audiencesMax,
      EVENT_LIMITS.audienceMax,
    );

  const venueName =
    getRequiredString(
      value,
      "venueName",
      "El lugar",
      EVENT_LIMITS.venueNameMin,
      EVENT_LIMITS.venueNameMax,
    );

  const address =
    getRequiredString(
      value,
      "address",
      "La dirección",
      EVENT_LIMITS.addressMin,
      EVENT_LIMITS.addressMax,
    );

  const city =
    getRequiredString(
      value,
      "city",
      "La ciudad",
      EVENT_LIMITS.cityMin,
      EVENT_LIMITS.cityMax,
    );

  const province =
    getRequiredString(
      value,
      "province",
      "La provincia",
      EVENT_LIMITS.provinceMin,
      EVENT_LIMITS.provinceMax,
    );

  const postalCode =
    getOptionalString(
      value,
      "postalCode",
      EVENT_LIMITS.postalCodeMax,
    );

  const startAt =
    parseDate(
      value,
      "startAt",
      "La fecha de inicio",
    );

  const endAt =
    parseDate(
      value,
      "endAt",
      "La fecha de finalización",
    );

  if (
    startAt.getTime() <=
    now.getTime()
  ) {
    throw new EventValidationError(
      "El evento debe comenzar en una fecha y hora futuras.",
    );
  }

  if (
    endAt.getTime() <=
    startAt.getTime()
  ) {
    throw new EventValidationError(
      "La finalización debe ser posterior al inicio.",
    );
  }

  const isFree =
    getBoolean(
      value,
      "isFree",
      true,
    );

  const rawPriceFrom =
    getNullableNumber(
      value,
      "priceFrom",
    );

  let priceFrom:
    | number
    | null =
    null;

  if (!isFree) {
    if (
      rawPriceFrom ===
        null ||
      rawPriceFrom < 0
    ) {
      throw new EventValidationError(
        "Indica un precio válido para el evento.",
      );
    }

    priceFrom =
      Math.round(
        rawPriceFrom *
          100,
      ) / 100;
  }

  const externalUrl =
    validateExternalUrl(
      getOptionalString(
        value,
        "externalUrl",
        2048,
      ),
    );

  let externalActionLabel =
    getOptionalString(
      value,
      "externalActionLabel",
      EVENT_LIMITS.externalActionLabelMax,
    );

  if (!externalUrl) {
    externalActionLabel =
      null;
  } else if (
    !externalActionLabel
  ) {
    externalActionLabel =
      "Más información";
  }

  const rawCapacity =
    getNullableNumber(
      value,
      "capacity",
    );

  let capacity:
    | number
    | null =
    null;

  if (
    rawCapacity !==
    null
  ) {
    if (
      !Number.isInteger(
        rawCapacity,
      ) ||
      rawCapacity <= 0 ||
      rawCapacity >
        EVENT_LIMITS.capacityMax
    ) {
      throw new EventValidationError(
        `El aforo debe ser un número entero entre 1 y ${EVENT_LIMITS.capacityMax}.`,
      );
    }

    capacity =
      rawCapacity;
  }

  return {
    title,
    description,
    category,

    tags,
    audience,

    venueName,
    address,
    city,
    province,
    postalCode,

    startAt,
    endAt,

    isFree,
    priceFrom,

    externalUrl,
    externalActionLabel,

    capacity,
  };
}