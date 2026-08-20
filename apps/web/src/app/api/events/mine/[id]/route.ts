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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type EventLifecycleStatus =
  | "draft"
  | "upcoming"
  | "live"
  | "ended"
  | "cancelled";

type EventRow = {
  id: string;

  creator_profile_id:
    string;

  title: string;
  description: string;
  category: string;

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

  province:
    string | null;

  postal_code:
    string | null;

  country_code:
    string | null;

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

  capacity:
    number | null;

  external_url:
    string | null;

  external_action_label:
    string | null;

  created_at:
    string;

  updated_at:
    string;
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

function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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

  if (
    rawStatus ===
    "published"
  ) {
    return "upcoming";
  }

  return "draft";
}

export async function GET(
  request: Request,
  context: RouteContext,
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

    const {
      id: rawEventId,
    } =
      await context.params;

    const eventId =
      rawEventId.trim();

    if (
      !isUuid(
        eventId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El evento solicitado no es válido.",
        },
        {
          status: 400,
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
          "id",
          eventId,
        )
        .eq(
          "creator_profile_id",
          authData.user.id,
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo cargar el evento: ${error.message}`,
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "El evento no existe o no te pertenece.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const event =
      data as EventRow;

    return NextResponse.json(
      {
        event: {
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
        },
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error cargando evento propio:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}