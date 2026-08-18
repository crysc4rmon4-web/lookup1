import {
  NextResponse,
} from "next/server";

import {
  EventValidationError,
  parseEventDraftCreateInput,
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

type ProfileRow = {
  id: string;

  account_type:
    | "person"
    | "business"
    | null;

  onboarding_completed:
    boolean;
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

function isSupportedAccountType(
  value:
    | string
    | null,
): value is
  | "person"
  | "business" {
  return (
    value === "person" ||
    value === "business"
  );
}

export async function POST(
  request: Request,
) {
  try {
    /*
     * ==========================================================
     * 1. AUTH
     * ==========================================================
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
     * ==========================================================
     * 2. VALIDAR INPUT
     * ==========================================================
     */

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

    const input =
      parseEventDraftCreateInput(
        body,
      );

    /*
     * ==========================================================
     * 3. COMPROBAR CREADOR
     * ==========================================================
     */

    const {
      data:
        profileData,
      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles",
        )
        .select(
          `
            id,
            account_type,
            onboarding_completed
          `,
        )
        .eq(
          "id",
          authData.user.id,
        )
        .maybeSingle();

    if (profileError) {
      throw new Error(
        `No se pudo comprobar el perfil creador: ${profileError.message}`,
      );
    }

    const profile =
      profileData as
        | ProfileRow
        | null;

    if (
      !profile ||
      !profile.onboarding_completed ||
      !isSupportedAccountType(
        profile.account_type,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Completa tu perfil antes de crear un evento.",
        },
        {
          status: 403,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * Persona y Business pasan exactamente
     * por este mismo flujo.
     *
     * No duplicamos Events por tipo de cuenta.
     */

    /*
     * ==========================================================
     * 4. COMPROBAR CATEGORÍA
     * ==========================================================
     */

    const {
      data:
        categoryData,
      error:
        categoryError,
    } =
      await supabaseAdmin
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
     * 5. VERIFICAR UBICACIÓN
     * ==========================================================
     *
     * No confiamos en latitude/longitude enviadas
     * por el navegador.
     *
     * El servidor resuelve:
     *
     * dirección
     * → lat/lng
     * → ciudad
     * → provincia
     */

    let location;

    try {
      location =
        await geocodeEventLocation(
          {
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
          },
        );
    } catch (
      locationError
    ) {
      const message =
        locationError instanceof
        Error
          ? locationError.message
          : "No se pudo verificar la ubicación.";

      return NextResponse.json(
        {
          error:
            message,
        },
        {
          status: 422,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ==========================================================
     * 6. REVALIDAR FECHA JUSTO ANTES DEL INSERT
     * ==========================================================
     *
     * El parseo ya la validó.
     *
     * La repetimos porque geocoding/auth/categoría
     * han consumido tiempo.
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

    /*
     * ==========================================================
     * 7. CREAR DRAFT REAL
     * ==========================================================
     */

    const {
      data:
        eventData,
      error:
        eventError,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .insert({
          creator_profile_id:
            authData.user.id,

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

          visibility:
            "public",

          status:
            "draft",

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
        })
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
          `,
        )
        .single();

    if (
      eventError ||
      !eventData
    ) {
      throw new Error(
        `No se pudo crear el borrador: ${
          eventError
            ?.message ??
          "respuesta vacía"
        }`,
      );
    }

    /*
     * ==========================================================
     * 8. RESPUESTA PÚBLICA CONTROLADA
     * ==========================================================
     */

    return NextResponse.json(
      {
        draft: {
          id:
            eventData.id,

          creatorProfileId:
            eventData.creator_profile_id,

          title:
            eventData.title,

          description:
            eventData.description,

          category:
            eventData.category,

          tags:
            eventData.tags,

          audience:
            eventData.audience,

          venueName:
            eventData.venue_name,

          address:
            eventData.address,

          city:
            eventData.city,

          cityKey:
            eventData.city_key,

          province:
            eventData.province,

          postalCode:
            eventData.postal_code,

          countryCode:
            eventData.country_code,

          latitude:
            eventData.latitude,

          longitude:
            eventData.longitude,

          startAt:
            eventData.start_at,

          endAt:
            eventData.end_at,

          status:
            eventData.status,

          isFree:
            eventData.is_free,

          priceFrom:
            eventData.price_from,

          currency:
            eventData.currency,

          externalUrl:
            eventData.external_url,

          externalActionLabel:
            eventData.external_action_label,

          capacity:
            eventData.capacity,

          createdAt:
            eventData.created_at,

          updatedAt:
            eventData.updated_at,
        },

        location: {
          verified:
            true,

          attribution:
            location.attribution,
        },
      },
      {
        status: 201,
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
      "❌ Error creando borrador de evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}