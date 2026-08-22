export type ExploreEventLifecycleStatus =
  | "upcoming"
  | "live";

export type ExploreEvent = {
  id: string;

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
  limit = 30,
  signal,
}: GetExploreEventsInput): Promise<
  ExploreEvent[]
> {
  const normalizedToken =
    accessToken.trim();

  const normalizedCity =
    city.trim();

  if (!normalizedToken) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  if (!normalizedCity) {
    throw new Error(
      "Selecciona una ciudad para explorar eventos.",
    );
  }

  const normalizedLimit =
    Math.min(
      Math.max(
        Math.trunc(
          limit,
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

  const normalizedCategory =
    category?.trim();

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
   *
   * Solo añadimos la propiedad cuando realmente
   * existe un AbortSignal.
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

  if (signal) {
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
      (await response.json()) as ExploreEventsResponse;
  } catch {
    payload =
      null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ??
        "No se pudieron cargar los eventos.",
    );
  }

  return Array.isArray(
    payload?.events,
  )
    ? payload.events
    : [];
}