import {
  NextResponse,
} from "next/server";

import {
  syncEventEmbedding,
} from "@/lib/ai/events/sync-event-embedding";

import {
  EventValidationError,
  parseEventDraftCreateInput,
  type ParsedEventDraftCreateInput,
} from "@/lib/events/event-domain";

import {
  geocodeEventLocation,
} from "@/lib/events/geocode-event-location";

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

  latitude:
    number | string | null;

  longitude:
    number | string | null;

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

type VerifiedLocation = {
  address: string;
  city: string;
  province: string;
  postalCode: string | null;
  countryCode: string;
  latitude: number;
  longitude: number;
};

const EVENT_SELECT = `
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
  latitude,
  longitude,
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
`;

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

function normalizeComparableText(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "es",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function normalizeNullableText(
  value:
    | string
    | null
    | undefined,
) {
  const normalized =
    value?.trim() ?? "";

  return normalized ||
    null;
}

function normalizeStringArray(
  value:
    | string[]
    | null
    | undefined,
) {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value
    .map(
      (item) =>
        item
          .trim()
          .replace(
            /\s+/g,
            " ",
          ),
    )
    .filter(Boolean);
}

function stringArraysEqual(
  first:
    | string[]
    | null
    | undefined,
  second:
    | string[]
    | null
    | undefined,
) {
  const normalizedFirst =
    normalizeStringArray(
      first,
    );

  const normalizedSecond =
    normalizeStringArray(
      second,
    );

  if (
    normalizedFirst.length !==
    normalizedSecond.length
  ) {
    return false;
  }

  return normalizedFirst.every(
    (
      value,
      index,
    ) =>
      value ===
      normalizedSecond[index],
  );
}

function numbersEqual(
  first:
    | number
    | null
    | undefined,
  second:
    | number
    | null
    | undefined,
) {
  if (
    first === null ||
    first === undefined
  ) {
    return (
      second === null ||
      second === undefined
    );
  }

  if (
    second === null ||
    second === undefined
  ) {
    return false;
  }

  return first ===
    second;
}

function datesEqual(
  first: string,
  second: Date,
) {
  const firstTime =
    new Date(
      first,
    ).getTime();

  const secondTime =
    second.getTime();

  return (
    Number.isFinite(
      firstTime,
    ) &&
    Number.isFinite(
      secondTime,
    ) &&
    firstTime ===
      secondTime
  );
}

function toFiniteCoordinate(
  value:
    | number
    | string
    | null
    | undefined,
) {
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
      : Number(
          value,
        );

  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : null;
}

function hasValidCoordinates(
  event: EventRow,
) {
  const latitude =
    toFiniteCoordinate(
      event.latitude,
    );

  const longitude =
    toFiniteCoordinate(
      event.longitude,
    );

  return (
    latitude !==
      null &&
    longitude !==
      null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function hasLocationChanged(
  currentEvent: EventRow,
  input: ParsedEventDraftCreateInput,
) {
  return (
    normalizeComparableText(
      currentEvent.address,
    ) !==
      normalizeComparableText(
        input.address,
      ) ||
    normalizeComparableText(
      currentEvent.city,
    ) !==
      normalizeComparableText(
        input.city,
      ) ||
    normalizeComparableText(
      currentEvent.province,
    ) !==
      normalizeComparableText(
        input.province,
      ) ||
    normalizeComparableText(
      currentEvent.postal_code,
    ) !==
      normalizeComparableText(
        input.postalCode,
      )
  );
}

function hasEventChanged(
  currentEvent: EventRow,
  input: ParsedEventDraftCreateInput,
) {
  if (
    currentEvent.title !==
    input.title
  ) {
    return true;
  }

  if (
    currentEvent.description !==
    input.description
  ) {
    return true;
  }

  if (
    currentEvent.category !==
    input.category
  ) {
    return true;
  }

  if (
    !stringArraysEqual(
      currentEvent.tags,
      input.tags,
    )
  ) {
    return true;
  }

  if (
    !stringArraysEqual(
      currentEvent.audience,
      input.audience,
    )
  ) {
    return true;
  }

  if (
    currentEvent.venue_name !==
    input.venueName
  ) {
    return true;
  }

  if (
    hasLocationChanged(
      currentEvent,
      input,
    )
  ) {
    return true;
  }

  if (
    !datesEqual(
      currentEvent.start_at,
      input.startAt,
    )
  ) {
    return true;
  }

  if (
    !datesEqual(
      currentEvent.end_at,
      input.endAt,
    )
  ) {
    return true;
  }

  if (
    (
      currentEvent.is_free ??
      true
    ) !==
    input.isFree
  ) {
    return true;
  }

  const expectedPrice =
    input.isFree
      ? null
      : input.priceFrom;

  if (
    !numbersEqual(
      currentEvent.price_from,
      expectedPrice,
    )
  ) {
    return true;
  }

  if (
    normalizeNullableText(
      currentEvent.external_url,
    ) !==
    normalizeNullableText(
      input.externalUrl,
    )
  ) {
    return true;
  }

  if (
    normalizeNullableText(
      currentEvent.external_action_label,
    ) !==
    normalizeNullableText(
      input.externalActionLabel,
    )
  ) {
    return true;
  }

  if (
    !numbersEqual(
      currentEvent.capacity,
      input.capacity,
    )
  ) {
    return true;
  }

  return false;
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
    startAt <= now &&
    endAt >= now
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
}

async function authenticate(
  request: Request,
) {
  const accessToken =
    getBearerToken(
      request,
    );

  if (!accessToken) {
    return {
      ok:
        false as const,

      response:
        NextResponse.json(
          {
            error:
              "No autorizado.",
          },
          {
            status: 401,
            headers:
              noStoreHeaders(),
          },
        ),
    };
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
    return {
      ok:
        false as const,

      response:
        NextResponse.json(
          {
            error:
              "La sesión no es válida.",
          },
          {
            status: 401,
            headers:
              noStoreHeaders(),
          },
        ),
    };
  }

  return {
    ok:
      true as const,

    userId:
      authData.user.id,

    supabaseAdmin,
  };
}

async function getRouteEventId(
  context: RouteContext,
) {
  const {
    id: rawEventId,
  } =
    await context.params;

  return rawEventId.trim();
}

async function getOwnedEvent(
  supabaseAdmin:
    ReturnType<
      typeof getSupabaseAdminClient
    >,
  userId: string,
  eventId: string,
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "events",
      )
      .select(
        EVENT_SELECT,
      )
      .eq(
        "id",
        eventId,
      )
      .eq(
        "creator_profile_id",
        userId,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo cargar el evento: ${error.message}`,
    );
  }

  return data
    ? (
        data as EventRow
      )
    : null;
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const auth =
      await authenticate(
        request,
      );

    if (!auth.ok) {
      return auth.response;
    }

    const eventId =
      await getRouteEventId(
        context,
      );

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

    const event =
      await getOwnedEvent(
        auth.supabaseAdmin,
        auth.userId,
        eventId,
      );

    if (!event) {
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

    return NextResponse.json(
      {
        event:
          mapEvent(
            event,
          ),
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

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const auth =
      await authenticate(
        request,
      );

    if (!auth.ok) {
      return auth.response;
    }

    const eventId =
      await getRouteEventId(
        context,
      );

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

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Los datos del evento no son válidos.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * La validación compartida normaliza textos,
     * fechas, precios, URL, tags y audiencia.
     *
     * La API continúa siendo la autoridad aunque
     * el cliente haya validado previamente.
     */
    const input =
      parseEventDraftCreateInput(
        body,
      );

    const currentEvent =
      await getOwnedEvent(
        auth.supabaseAdmin,
        auth.userId,
        eventId,
      );

    if (!currentEvent) {
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

    const currentStatus =
      String(
        currentEvent.status ??
          "",
      )
        .trim()
        .toLowerCase();

    if (
      currentStatus !==
        "draft" &&
      currentStatus !==
        "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Este evento ya no puede editarse.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * Un evento publicado solo puede modificarse
     * antes de que empiece.
     */
    if (
      currentStatus ===
      "published"
    ) {
      const currentStart =
        new Date(
          currentEvent.start_at,
        ).getTime();

      if (
        !Number.isFinite(
          currentStart,
        ) ||
        currentStart <=
          Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "Un evento que ya comenzó no puede editarse.",
          },
          {
            status: 409,
            headers:
              noStoreHeaders(),
          },
        );
      }
    }

    /*
     * NO-OP
     *
     * Si el formulario llega exactamente con la misma
     * información que ya está persistida:
     *
     * - no escribimos en PostgreSQL
     * - no invalidamos Intelligence
     * - no llamamos al geocodificador
     * - no sincronizamos embeddings
     *
     * Guardar sin cambios debe ser una operación inocua.
     */
    const eventChanged =
      hasEventChanged(
        currentEvent,
        input,
      );

    if (!eventChanged) {
      return NextResponse.json(
        {
          event:
            mapEvent(
              currentEvent,
            ),

          changed:
            false,

          locationReverified:
            false,

          intelligenceInvalidated:
            false,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * La categoría solo necesita comprobarse cuando
     * existe una edición real.
     */
    const {
      data: categoryData,
      error: categoryError,
    } =
      await auth.supabaseAdmin
        .from(
          "event_categories",
        )
        .select(
          "slug",
        )
        .eq(
          "slug",
          input.category,
        )
        .eq(
          "is_active",
          true,
        )
        .maybeSingle();

    if (categoryError) {
      throw new Error(
        `No se pudo comprobar la categoría: ${categoryError.message}`,
      );
    }

    if (!categoryData) {
      return NextResponse.json(
        {
          error:
            "Selecciona una categoría de evento válida.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ==========================================================
     * UBICACIÓN
     * ==========================================================
     *
     * Una dirección que LookUp ya verificó no debe depender
     * otra vez de Nominatim cada vez que el creador cambia
     * título, descripción, fecha, precio, etc.
     *
     * Solo geocodificamos si:
     *
     * 1. cambia dirección / municipio / provincia / CP, o
     * 2. el registro antiguo carece de coordenadas válidas.
     */
    const locationChanged =
      hasLocationChanged(
        currentEvent,
        input,
      );

    const currentLatitude =
      toFiniteCoordinate(
        currentEvent.latitude,
      );

    const currentLongitude =
      toFiniteCoordinate(
        currentEvent.longitude,
      );

    const mustVerifyLocation =
      locationChanged ||
      !hasValidCoordinates(
        currentEvent,
      );

    let location:
      VerifiedLocation;

    if (
      mustVerifyLocation
    ) {
      try {
        const verified =
          await geocodeEventLocation({
            venueName:
              input.venueName,

            address:
              input.address,

            city:
              input.city,

            province:
              input.province,

            postalCode:
              input.postalCode,
          });

        location = {
          address:
            verified.address,

          city:
            verified.city,

          province:
            verified.province,

          postalCode:
            verified.postalCode,

          countryCode:
            verified.countryCode,

          latitude:
            verified.latitude,

          longitude:
            verified.longitude,
        };
      } catch (
        locationError
      ) {
        return NextResponse.json(
          {
            error:
              locationError instanceof
                Error
                ? locationError.message
                : "No se pudo verificar la ubicación.",
          },
          {
            status: 422,
            headers:
              noStoreHeaders(),
          },
        );
      }
    } else {
      /*
       * La ubicación no cambió y sus coordenadas ya fueron
       * verificadas previamente.
       *
       * Conservamos exactamente los datos canónicos guardados
       * en vez de convertirlos otra vez en input de Nominatim.
       */
      location = {
        address:
          currentEvent.address,

        city:
          currentEvent.city,

        province:
          currentEvent.province ??
          input.province,

        postalCode:
          currentEvent.postal_code,

        countryCode:
          currentEvent.country_code ??
          "ES",

        latitude:
          currentLatitude as number,

        longitude:
          currentLongitude as number,
      };
    }

    /*
     * El parseo ya verificó que la fecha fuese futura.
     *
     * Repetimos la comprobación justo antes del UPDATE porque
     * las operaciones anteriores han consumido tiempo.
     */
    if (
      input.startAt.getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "El evento debe comenzar en una fecha y hora futuras.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const nowIso =
      new Date().toISOString();

    const {
      data: updatedData,
      error: updateError,
    } =
      await auth.supabaseAdmin
        .from(
          "events",
        )
        .update({
          title:
            input.title,

          description:
            input.description,

          category:
            input.category,

          tags:
            input.tags,

          audience:
            input.audience,

          venue_name:
            input.venueName,

          address:
            location.address,

          city:
            location.city,

          province:
            location.province,

          postal_code:
            location.postalCode,

          country_code:
            location.countryCode,

          latitude:
            location.latitude,

          longitude:
            location.longitude,

          start_at:
            input.startAt.toISOString(),

          end_at:
            input.endAt.toISOString(),

          is_free:
            input.isFree,

          price_from:
            input.isFree
              ? null
              : input.priceFrom,

          currency:
            "EUR",

          external_url:
            input.externalUrl,

          external_action_label:
            input.externalActionLabel,

          capacity:
            input.capacity,

          updated_at:
            nowIso,
        })
        .eq(
          "id",
          eventId,
        )
        .eq(
          "creator_profile_id",
          auth.userId,
        )
        .in(
          "status",
          [
            "draft",
            "published",
          ],
        )
        .select(
          EVENT_SELECT,
        )
        .maybeSingle();

    if (updateError) {
      throw new Error(
        `No se pudo actualizar el evento: ${updateError.message}`,
      );
    }

    if (!updatedData) {
      return NextResponse.json(
        {
          error:
            "El evento cambió de estado y ya no puede editarse.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * Una edición real invalida el análisis pre-publicación
     * previo.
     *
     * Nunca debemos mostrar como vigente una recomendación
     * calculada sobre otra versión del evento.
     */
    const {
      error:
        insightDeleteError,
    } =
      await auth.supabaseAdmin
        .from(
          "event_insights",
        )
        .delete()
        .eq(
          "event_id",
          eventId,
        )
        .eq(
          "phase",
          "prepublish",
        );

    if (
      insightDeleteError
    ) {
      /*
       * El evento YA se ha actualizado.
       *
       * No convertimos una operación persistida correctamente
       * en un falso error para el usuario.
       */
      console.error(
        "❌ El evento se actualizó pero no pudo invalidarse el insight anterior:",
        insightDeleteError,
      );
    }

    /*
     * El embedding utiliza hash semántico.
     *
     * Si solo cambió ubicación, precio, fecha, etc., el servicio
     * podrá devolver "unchanged" sin regenerarlo.
     *
     * Un fallo de IA nunca revierte una edición válida.
     */
    try {
      await syncEventEmbedding({
        eventId,

        title:
          input.title,

        description:
          input.description,

        category:
          input.category,

        tags:
          input.tags,

        audience:
          input.audience,
      });
    } catch (
      embeddingError
    ) {
      console.error(
        "❌ El evento se actualizó pero no pudo sincronizarse su embedding:",
        embeddingError,
      );
    }

    return NextResponse.json(
      {
        event:
          mapEvent(
            updatedData as EventRow,
          ),

        changed:
          true,

        locationReverified:
          mustVerifyLocation,

        intelligenceInvalidated:
          true,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    if (
      error instanceof
      EventValidationError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    console.error(
      "❌ Error actualizando evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const auth =
      await authenticate(
        request,
      );

    if (!auth.ok) {
      return auth.response;
    }

    const eventId =
      await getRouteEventId(
        context,
      );

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

    const {
      data: eventData,
      error: eventError,
    } =
      await auth.supabaseAdmin
        .from(
          "events",
        )
        .select(
          `
            id,
            status
          `,
        )
        .eq(
          "id",
          eventId,
        )
        .eq(
          "creator_profile_id",
          auth.userId,
        )
        .maybeSingle();

    if (eventError) {
      throw new Error(
        `No se pudo comprobar el borrador: ${eventError.message}`,
      );
    }

    if (!eventData) {
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

    if (
      eventData.status !==
      "draft"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo los borradores pueden eliminarse definitivamente.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * Por ahora mantenemos el borrado explícito de los recursos
     * asociados porque ya forma parte de la arquitectura actual.
     *
     * Más adelante podemos consolidarlo mediante FK ON DELETE
     * CASCADE/transacción SQL cuando revisemos las restricciones
     * definitivas del modelo de eventos.
     */
    const {
      error:
        insightDeleteError,
    } =
      await auth.supabaseAdmin
        .from(
          "event_insights",
        )
        .delete()
        .eq(
          "event_id",
          eventId,
        );

    if (
      insightDeleteError
    ) {
      throw new Error(
        `No se pudieron eliminar los análisis del borrador: ${insightDeleteError.message}`,
      );
    }

    const {
      error:
        embeddingDeleteError,
    } =
      await auth.supabaseAdmin
        .from(
          "event_embeddings",
        )
        .delete()
        .eq(
          "event_id",
          eventId,
        );

    if (
      embeddingDeleteError
    ) {
      throw new Error(
        `No se pudo eliminar el embedding del borrador: ${embeddingDeleteError.message}`,
      );
    }

    const {
      data: deletedEvent,
      error:
        eventDeleteError,
    } =
      await auth.supabaseAdmin
        .from(
          "events",
        )
        .delete()
        .eq(
          "id",
          eventId,
        )
        .eq(
          "creator_profile_id",
          auth.userId,
        )
        .eq(
          "status",
          "draft",
        )
        .select(
          "id",
        )
        .maybeSingle();

    if (
      eventDeleteError
    ) {
      throw new Error(
        `No se pudo eliminar el borrador: ${eventDeleteError.message}`,
      );
    }

    if (!deletedEvent) {
      return NextResponse.json(
        {
          error:
            "El borrador ya no está disponible para eliminarse.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        eventId:
          deletedEvent.id,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error eliminando borrador de evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar el borrador.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}