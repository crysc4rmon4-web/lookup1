import type {
  EditableEventDiscoveryDateScope,
  EventDiscoveryPreferences,
} from "@/lib/events/event-discovery-preferences";

type PreferencesResponse = {
  preferences?:
    EventDiscoveryPreferences;

  error?:
    string;
};

type GetPreferencesInput = {
  accessToken:
    string;

  signal?:
    AbortSignal;
};

export type UpdateEventDiscoveryPreferencesInput = {
  accessToken:
    string;

  dateScope?:
    EditableEventDiscoveryDateScope;

  intentText?:
    string | null;

  signal?:
    AbortSignal;
};

function createRequestInit(
  accessToken:
    string,

  signal?:
    AbortSignal,
) {
  const requestInit:
    RequestInit = {
    headers: {
      Authorization:
        `Bearer ${accessToken}`,
    },

    cache:
      "no-store",
  };

  if (
    signal
  ) {
    requestInit.signal =
      signal;
  }

  return requestInit;
}

async function readPreferencesResponse(
  response:
    Response,
) {
  let payload:
    PreferencesResponse | null =
    null;

  try {
    payload =
      (await response.json()) as
        PreferencesResponse;
  } catch {
    payload =
      null;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error ??
      "No se pudieron procesar tus preferencias de eventos.",
    );
  }

  if (
    !payload?.preferences
  ) {
    throw new Error(
      "LookUp no recibió unas preferencias válidas.",
    );
  }

  return payload.preferences;
}

export async function getEventDiscoveryPreferences({
  accessToken,
  signal,
}: GetPreferencesInput): Promise<EventDiscoveryPreferences> {
  const normalizedToken =
    accessToken.trim();

  if (
    !normalizedToken
  ) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  const requestInit =
    createRequestInit(
      normalizedToken,
      signal,
    );

  requestInit.method =
    "GET";

  const response =
    await fetch(
      "/api/events/preferences",
      requestInit,
    );

  return readPreferencesResponse(
    response,
  );
}

export async function updateEventDiscoveryPreferences({
  accessToken,
  dateScope,
  intentText,
  signal,
}: UpdateEventDiscoveryPreferencesInput): Promise<EventDiscoveryPreferences> {
  const normalizedToken =
    accessToken.trim();

  if (
    !normalizedToken
  ) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  const body: {
    dateScope?:
      EditableEventDiscoveryDateScope;

    intentText?:
      string | null;
  } = {};

  if (
    dateScope !==
    undefined
  ) {
    body.dateScope =
      dateScope;
  }

  if (
    intentText !==
    undefined
  ) {
    body.intentText =
      intentText;
  }

  if (
    Object.keys(
      body,
    ).length ===
    0
  ) {
    throw new Error(
      "No hay cambios que guardar.",
    );
  }

  const requestInit =
    createRequestInit(
      normalizedToken,
      signal,
    );

  requestInit.method =
    "PATCH";

  requestInit.headers = {
    ...requestInit.headers,

    "Content-Type":
      "application/json",
  };

  requestInit.body =
    JSON.stringify(
      body,
    );

  const response =
    await fetch(
      "/api/events/preferences",
      requestInit,
    );

  return readPreferencesResponse(
    response,
  );
}