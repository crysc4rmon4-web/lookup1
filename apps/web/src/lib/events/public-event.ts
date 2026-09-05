import type {
  PersistedEventImage,
} from "./event-images";

export type PublicEventLifecycleStatus =
  | "upcoming"
  | "live"
  | "ended";

export type PublicEvent = {
  id: string;

  creatorProfileId: string;

  title: string;

  description: string;

  category: string;

  coverImageUrl: string | null;

  images: PersistedEventImage[];

  tags: string[];

  audience: string[];

  venueName: string;

  address: string;

  city: string;

  cityKey: string | null;

  province: string | null;

  postalCode: string | null;

  countryCode: string | null;

  latitude: number | null;

  longitude: number | null;

  startAt: string;

  endAt: string;

  lifecycleStatus:
    PublicEventLifecycleStatus;

  isFree: boolean;

  priceFrom: number | null;

  currency: string;

  externalUrl: string | null;

  externalActionLabel:
    string | null;

  capacity: number | null;

  createdAt: string;

  updatedAt: string;
};

export type PublicEventRow = {
  id: string;

  creator_profile_id:
    string;

  title:
    string;

  description:
    string;

  category:
    string;

  cover_image_url:
    string | null;

  tags:
    string[] | null;

  audience:
    string[] | null;

  venue_name:
    string;

  address:
    string;

  city:
    string;

  city_key:
    string | null;

  province:
    string | null;

  postal_code:
    string | null;

  country_code:
    string | null;

  latitude:
    number | null;

  longitude:
    number | null;

  start_at:
    string;

  end_at:
    string;

  status:
    string | null;

  is_free:
    boolean | null;

  price_from:
    number | null;

  currency:
    string | null;

  external_url:
    string | null;

  external_action_label:
    string | null;

  capacity:
    number | null;

  created_at:
    string;

  updated_at:
    string;
};

export const PUBLIC_EVENT_SELECT = `
  id,
  creator_profile_id,
  title,
  description,
  category,
  cover_image_url,
  tags,
  audience,
  venue_name,
  address,
  city,
  city_key,
  province,
  postal_code,
  country_code,
  latitude,
  longitude,
  start_at,
  end_at,
  status,
  is_free,
  price_from,
  currency,
  external_url,
  external_action_label,
  capacity,
  created_at,
  updated_at
`;

export function derivePublicEventLifecycleStatus(
  event: Pick<
    PublicEventRow,
    "start_at" | "end_at"
  >,
): PublicEventLifecycleStatus {
  const now =
    Date.now();

  const startAt =
    new Date(
      event.start_at,
    ).getTime();

  const endAt =
    new Date(
      event.end_at,
    ).getTime();

  if (
    Number.isFinite(
      endAt,
    ) &&
    endAt < now
  ) {
    return "ended";
  }

  if (
    Number.isFinite(
      startAt,
    ) &&
    startAt <= now
  ) {
    return "live";
  }

  return "upcoming";
}

export function mapPublicEventRow(
  event:
    PublicEventRow,
): PublicEvent {
  return {
    id:
      event.id,

    creatorProfileId:
      event.creator_profile_id,

    title:
      event.title,

    description:
      event.description,

    category:
      event.category,

    coverImageUrl:
      event.cover_image_url,

      images: [],

    tags:
      event.tags ??
      [],

    audience:
      event.audience ??
      [],

    venueName:
      event.venue_name,

    address:
      event.address,

    city:
      event.city,

    cityKey:
      event.city_key,

    province:
      event.province,

    postalCode:
      event.postal_code,

    countryCode:
      event.country_code,

    latitude:
      event.latitude,

    longitude:
      event.longitude,

    startAt:
      event.start_at,

    endAt:
      event.end_at,

    lifecycleStatus:
      derivePublicEventLifecycleStatus(
        event,
      ),

    isFree:
      event.is_free ??
      true,

    priceFrom:
      event.price_from,

    currency:
      event.currency ??
      "EUR",

    externalUrl:
      event.external_url,

    externalActionLabel:
      event.external_action_label,

    capacity:
      event.capacity,

    createdAt:
      event.created_at,

    updatedAt:
      event.updated_at,
  };
}