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

type ExploreLifecycleStatus =
  | "upcoming"
  | "live";

type EventRow = {
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

function normalizeLocationKey(
  value: string,
) {
  return value
    .trim()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      "-",
    );
}

function deriveLifecycleStatus(
  event: EventRow,
): ExploreLifecycleStatus {
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
    Number.isFinite(
      startAt,
    ) &&
    Number.isFinite(
      endAt,
    ) &&
    startAt <= now &&
    endAt >= now
  ) {
    return "live";
  }

  return "upcoming";
}

function parseLimit(
  value:
    string | null,
) {
  if (!value) {
    return 30;
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return 30;
  }

  return Math.min(
    Math.max(
      parsed,
      1,
    ),
    50,
  );
}

function mapEvent(
  event: EventRow,
) {
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

    startAt:
      event.start_at,

    endAt:
      event.end_at,

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

    createdAt:
      event.created_at,

    updatedAt:
      event.updated_at,
  };
}

export async function GET(
  request: Request,
) {
  try {
    /*
     * ========================================================
     * 1. AUTENTICACIÓN
     * ========================================================
     *
     * Explore forma parte del dashboard autenticado.
     *
     * Más adelante podremos tener una versión pública
     * independiente para compartir URLs de eventos.
     */
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

    /*
     * ========================================================
     * 2. FILTROS
     * ========================================================
     */
    const url =
      new URL(
        request.url,
      );

    const city =
      url.searchParams
        .get(
          "city",
        )
        ?.trim() ??
      "";

    const category =
      url.searchParams
        .get(
          "category",
        )
        ?.trim()
        .toLowerCase() ??
      "";

    const limit =
      parseLimit(
        url.searchParams.get(
          "limit",
        ),
      );

    if (
      city.length <
        2 ||
      city.length >
        120
    ) {
      return NextResponse.json(
        {
          error:
            "Selecciona una ciudad válida para explorar eventos.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      category &&
      !/^[a-z0-9-]+$/.test(
        category,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La categoría solicitada no es válida.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const cityKey =
      normalizeLocationKey(
        city,
      );

    const nowIso =
      new Date().toISOString();

    /*
     * ========================================================
     * 3. EVENTOS PUBLICADOS DE ESA CIUDAD
     * ========================================================
     *
     * IMPORTANTE:
     *
     * Radar:
     *   proximidad física en tiempo real.
     *
     * Eventos:
     *   descubrimiento territorial por ciudad.
     *
     * Aquí NO utilizamos distancia respecto al creador.
     */
    let query =
      supabaseAdmin
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
            start_at,
            end_at,
            status,
            is_free,
            price_from,
            currency,
            capacity,
            created_at,
            updated_at
          `,
        )
        .eq(
          "status",
          "published",
        )
        .eq(
          "city_key",
          cityKey,
        )
        .gt(
          "end_at",
          nowIso,
        )
        .order(
          "start_at",
          {
            ascending:
              true,
          },
        )
        .limit(
          limit,
        );

    if (category) {
      query =
        query.eq(
          "category",
          category,
        );
    }

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      throw new Error(
        `No se pudieron cargar los eventos publicados: ${error.message}`,
      );
    }

    const events =
      (
        data ??
        []
      ).map(
        (
          rawEvent,
        ) =>
          mapEvent(
            rawEvent as EventRow,
          ),
      );

    return NextResponse.json(
      {
        city,
        cityKey,

        events,

        count:
          events.length,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error cargando feed público de eventos:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los eventos de esta ciudad.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}