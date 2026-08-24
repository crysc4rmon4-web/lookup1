export type EventDiscoveryDateScope =
  | "all"
  | "today"
  | "weekend"
  | "week"
  | "month"
  | "custom";

export type EditableEventDiscoveryDateScope =
  Exclude<
    EventDiscoveryDateScope,
    "custom"
  >;

export type EventDiscoverySelectionMode =
  | "manual"
  | "location";

export type EventDiscoveryPreferences = {
  profileId:
    string;

  selectedCity:
    string | null;

  selectedCityKey:
    string | null;

  selectedProvince:
    string | null;

  countryCode:
    string;

  selectionMode:
    EventDiscoverySelectionMode;

  intentText:
    string | null;

  intentExpiresAt:
    string | null;

  dateScope:
    EventDiscoveryDateScope;

  dateFrom:
    string | null;

  dateTo:
    string | null;

  categories:
    string[];

  freeOnly:
    boolean;

  updatedAt:
    string | null;
};

export const EVENT_DISCOVERY_INTENT_MAX_LENGTH =
  280;

export const EVENT_DISCOVERY_INTENT_TTL_DAYS =
  7;

export const DEFAULT_EVENT_DISCOVERY_DATE_SCOPE:
  EditableEventDiscoveryDateScope =
  "all";

export function isEventDiscoveryDateScope(
  value: unknown,
): value is EventDiscoveryDateScope {
  return (
    value === "all" ||
    value === "today" ||
    value === "weekend" ||
    value === "week" ||
    value === "month" ||
    value === "custom"
  );
}

export function isEditableEventDiscoveryDateScope(
  value: unknown,
): value is EditableEventDiscoveryDateScope {
  return (
    value === "all" ||
    value === "today" ||
    value === "weekend" ||
    value === "week" ||
    value === "month"
  );
}

export function normalizeEventDiscoveryIntentText(
  value:
    string | null | undefined,
) {
  const normalized =
    value
      ?.normalize(
        "NFKC",
      )
      .trim()
      .replace(
        /\s+/g,
        " ",
      ) ??
    "";

  if (
    normalized.length >
    EVENT_DISCOVERY_INTENT_MAX_LENGTH
  ) {
    throw new Error(
      `La intención actual no puede superar ${EVENT_DISCOVERY_INTENT_MAX_LENGTH} caracteres.`,
    );
  }

  return normalized;
}

export function createEventDiscoveryIntentExpiresAt() {
  const expiresAt =
    new Date();

  expiresAt.setUTCDate(
    expiresAt.getUTCDate() +
      EVENT_DISCOVERY_INTENT_TTL_DAYS,
  );

  return expiresAt.toISOString();
}

export function isEventDiscoveryIntentExpired(
  expiresAt:
    string | null | undefined,
) {
  if (
    !expiresAt
  ) {
    return false;
  }

  const timestamp =
    new Date(
      expiresAt,
    ).getTime();

  if (
    !Number.isFinite(
      timestamp,
    )
  ) {
    return true;
  }

  return (
    timestamp <=
    Date.now()
  );
}