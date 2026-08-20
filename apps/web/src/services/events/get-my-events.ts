export type EventLifecycleStatus =
  | "draft"
  | "upcoming"
  | "live"
  | "ended"
  | "cancelled";

export type MyEvent = {
  id: string;

  creatorProfileId:
    string;

  title: string;

  description:
    string;

  category:
    string;

  tags: string[];

  audience:
    string[];

  venueName:
    string;

  address:
    string;

  city:
    string;

  province:
    string | null;

  postalCode:
    string | null;

  countryCode:
    string | null;

  startAt:
    string;

  endAt:
    string;

  rawStatus:
    string | null;

  lifecycleStatus:
    EventLifecycleStatus;

  isFree:
    boolean;

  priceFrom:
    number | null;

  currency:
    string;

  capacity:
    number | null;

  externalUrl:
    string | null;

  externalActionLabel:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

type GetMyEventsResponse = {
  events?: MyEvent[];
  error?: string;
};

export async function getMyEvents(
  accessToken: string,
): Promise<MyEvent[]> {
  const normalizedToken =
    accessToken.trim();

  if (!normalizedToken) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  const response =
    await fetch(
      "/api/events/mine",
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${normalizedToken}`,
        },

        cache:
          "no-store",
      },
    );

  let payload:
    GetMyEventsResponse | null =
    null;

  try {
    payload =
      (await response.json()) as GetMyEventsResponse;
  } catch {
    payload =
      null;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error ??
        "No se pudieron cargar tus eventos.",
    );
  }

  return Array.isArray(
    payload?.events,
  )
    ? payload.events
    : [];
}