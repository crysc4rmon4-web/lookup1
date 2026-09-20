export type ExploreEventLifecycleStatus =
  | "upcoming"
  | "live";

export type ExploreEventRelevanceLevel =
  | "strong"
  | "good"
  | "exploratory"
  | "low";

export type ExploreEvent = {
  latitude: number | null;
  longitude: number | null;
  id:
    string;

  creatorProfileId:
    string;

  title:
    string;

  description:
    string;

  category:
    string;

  coverImageUrl:
    string | null;

  tags:
    string[];

  audience:
    string[];

  venueName:
    string;

  address:
    string;

  city:
    string;

  cityKey:
    string | null;

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

  lifecycleStatus:
    ExploreEventLifecycleStatus;

  isFavorite:
    boolean;

  canFavorite:
    boolean;

  relevanceScore:
    number | null;

  relevanceLevel:
    ExploreEventRelevanceLevel | null;

  matchedInterests:
    string[];

  isFree:
    boolean;

  priceFrom:
    number | null;

  currency:
    string;

  capacity:
    number | null;

  createdAt:
    string;

  updatedAt:
    string;
};

type ExploreEventsResponse = {
  city?:
    string;

  cityKey?:
    string;

  events?:
    ExploreEvent[];

  count?:
    number;

  error?:
    string;
};

type GetExploreEventsInput = {
  mapView?: boolean;
  province?: string;
  offset?: number;
  accessToken:
    string;

  city:
    string;

  category?:
    string | null;

  limit?:
    number;

  signal?:
    AbortSignal;
};

export async function getExploreEvents({
  accessToken,
  city,
  category = null,
  mapView = false,
  province,
  offset = 0,
  limit = 30,
  signal,
}: GetExploreEventsInput): Promise<
  ExploreEvent[]
> {
  const normalizedToken =
    accessToken.trim();

  const normalizedCity =
    city.trim();

  if (
    !normalizedToken
  ) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  if (
    !normalizedCity
  ) {
    throw new Error(
      "Selecciona una ciudad para explorar eventos.",
    );
  }

  const normalizedLimit =
    Math.min(
      Math.max(
        Math.trunc(
          mapView ? 50 : limit,
        ),
        1,
      ),
      50,
    );

  const params =
    new URLSearchParams({
      city:
        normalizedCity,

      limit:
        String(
          normalizedLimit,
        ),
    });

  if (mapView) {
    params.set("view", "map");
    params.set("offset", String(offset));
  }

  if (province) params.set("province", province);

  const normalizedCategory =
    category
      ?.trim();

  if (
    normalizedCategory
  ) {
    params.set(
      "category",
      normalizedCategory,
    );
  }

  /*
   * Con exactOptionalPropertyTypes no debemos
   * enviar signal: undefined.
   */
  const requestInit:
    RequestInit = {
    method:
      "GET",

    headers: {
      Authorization:
        `Bearer ${normalizedToken}`,
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

  const response =
    await fetch(
      `/api/events/explore?${params.toString()}`,
      requestInit,
    );

  let payload:
    ExploreEventsResponse | null =
    null;

  try {
    payload =
      (await response.json()) as
        ExploreEventsResponse;
  } catch {
    payload =
      null;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error ??
      "No se pudieron cargar los eventos.",
    );
  }

  const events = Array.isArray(
    payload
      ?.events,
  )
    ? payload.events
    : [];
  if (mapView && events.length === normalizedLimit) {
    const next = await getExploreEvents({
      accessToken, city, category, mapView, offset: offset + normalizedLimit,
      ...(signal ? { signal } : {}),
      ...(province ? { province } : {}),
    });
    return [...events, ...next];
  }
  return events;
}