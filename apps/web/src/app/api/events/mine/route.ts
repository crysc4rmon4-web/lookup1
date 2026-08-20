import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type EventLifecycleStatus =
  | "draft"
  | "upcoming"
  | "live"
  | "ended"
  | "cancelled";

type EventRow = {
  id: string;

  creator_profile_id: string;

  title: string;
  description: string;

  category: string;

  tags:
    | string[]
    | null;

  audience:
    | string[]
    | null;

  venue_name: string;

  address: string;
  city: string;

  province:
    | string
    | null;

  postal_code:
    | string
    | null;

  country_code:
    | string
    | null;

  start_at: string;
  end_at: string;

  status:
    | string
    | null;

  is_free:
    | boolean
    | null;

  price_from:
    | number
    | null;

  currency:
    | string
    | null;

  capacity:
    | number
    | null;

  external_url:
    | string
    | null;

  external_action_label:
    | string
    | null;

  created_at: string;
  updated_at: string;
};

function getBearerToken(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  return token || null;
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
}

function deriveLifecycleStatus(
  event: EventRow,
): EventLifecycleStatus {
  const rawStatus =
    event.status
      ?.trim()
      .toLowerCase();

  if (
    rawStatus ===
    "cancelled"
  ) {
    return "cancelled";
  }

  if (
    rawStatus ===
    "draft"
  ) {
    return "draft";
  }

  if (
    rawStatus ===
    "live"
  ) {
    return "live";
  }

  if (
    rawStatus ===
    "ended"
  ) {
    return "ended";
  }

  const startAt =
    new Date(
      event.start_at,
    ).getTime();

  const endAt =
    new Date(
      event.end_at,
    ).getTime();

  const now =
    Date.now();

  if (
    !Number.isFinite(
      startAt,
    ) ||
    !Number.isFinite(
      endAt,
    )
  ) {
    return rawStatus ===
      "published"
      ? "upcoming"
      : "draft";
  }

  if (
    endAt <
    now
  ) {
    return "ended";
  }

  if (
    startAt <=
      now &&
    endAt >=
      now
  ) {
    return "live";
  }

  return rawStatus ===
    "published"
    ? "upcoming"
    : "draft";
}

export async function GET(
  request: Request,
) {
  try {
    const accessToken =
      getBearerToken(
        request,
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const supabaseAdmin =
      getSupabaseAdminClient();

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken,
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .select(
          `
            id,
            creator_profile_id,
            title,
            description,
            category,
            tags,
            audience,
            venue_name,
            address,
            city,
            province,
            postal_code,
            country_code,
            start_at,
            end_at,
            status,
            is_free,
            price_from,
            currency,
            capacity,
            external_url,
            external_action_label,
            created_at,
            updated_at
          `,
        )
        .eq(
          "creator_profile_id",
          authData.user.id,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(
          100,
        );

    if (error) {
      throw new Error(
        `No se pudieron cargar tus eventos: ${error.message}`,
      );
    }

    const events =
      (
        data ?? []
      ).map(
        (rawEvent) => {
          const event =
            rawEvent as EventRow;

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

            province:
              event.province,

            postalCode:
              event.postal_code,

            countryCode:
              event.country_code,

            startAt:
              event.start_at,

            endAt:
              event.end_at,

            rawStatus:
              event.status,

            lifecycleStatus:
              deriveLifecycleStatus(
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

            capacity:
              event.capacity,

            externalUrl:
              event.external_url,

            externalActionLabel:
              event.external_action_label,

            createdAt:
              event.created_at,

            updatedAt:
              event.updated_at,
          };
        },
      );

    return NextResponse.json(
      {
        events,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error cargando eventos propios:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar tus eventos.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}