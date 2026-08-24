import {
  NextResponse,
} from "next/server";

import {
  syncEventDiscoveryIntent,
} from "@/lib/ai/events/sync-event-discovery-intent";

import {
  DEFAULT_EVENT_DISCOVERY_DATE_SCOPE,
  isEditableEventDiscoveryDateScope,
  isEventDiscoveryDateScope,
  isEventDiscoveryIntentExpired,
  normalizeEventDiscoveryIntentText,
  type EventDiscoveryDateScope,
  type EventDiscoveryPreferences,
  type EventDiscoverySelectionMode,
} from "@/lib/events/event-discovery-preferences";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type PreferenceRow = {
  profile_id:
    string;

  selected_city:
    string | null;

  selected_city_key:
    string | null;

  selected_province:
    string | null;

  country_code:
    string;

  selection_mode:
    string;

  intent_text:
    string | null;

  intent_expires_at:
    string | null;

  date_scope:
    string;

  date_from:
    string | null;

  date_to:
    string | null;

  categories:
    string[] | null;

  free_only:
    boolean | null;

  updated_at:
    string | null;
};

type UpdatePreferencesBody = {
  dateScope?:
    unknown;

  intentText?:
    unknown;
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
      .slice(
        7,
      )
      .trim();

  return token || null;
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
}

function normalizeSelectionMode(
  value: string,
): EventDiscoverySelectionMode {
  return value ===
    "location"
    ? "location"
    : "manual";
}

function normalizeDateScope(
  value: string,
): EventDiscoveryDateScope {
  return isEventDiscoveryDateScope(
    value,
  )
    ? value
    : DEFAULT_EVENT_DISCOVERY_DATE_SCOPE;
}

function mapPreferences(
  profileId:
    string,

  row:
    PreferenceRow | null,
): EventDiscoveryPreferences {
  if (
    !row
  ) {
    return {
      profileId,

      selectedCity:
        null,

      selectedCityKey:
        null,

      selectedProvince:
        null,

      countryCode:
        "ES",

      selectionMode:
        "manual",

      intentText:
        null,

      intentExpiresAt:
        null,

      dateScope:
        DEFAULT_EVENT_DISCOVERY_DATE_SCOPE,

      dateFrom:
        null,

      dateTo:
        null,

      categories:
        [],

      freeOnly:
        false,

      updatedAt:
        null,
    };
  }

  const intentExpired =
    isEventDiscoveryIntentExpired(
      row.intent_expires_at,
    );

  return {
    profileId:
      row.profile_id,

    selectedCity:
      row.selected_city,

    selectedCityKey:
      row.selected_city_key,

    selectedProvince:
      row.selected_province,

    countryCode:
      row.country_code ||
      "ES",

    selectionMode:
      normalizeSelectionMode(
        row.selection_mode,
      ),

    intentText:
      intentExpired
        ? null
        : row.intent_text,

    intentExpiresAt:
      intentExpired
        ? null
        : row.intent_expires_at,

    dateScope:
      normalizeDateScope(
        row.date_scope,
      ),

    dateFrom:
      row.date_from,

    dateTo:
      row.date_to,

    categories:
      Array.isArray(
        row.categories,
      )
        ? row.categories
        : [],

    freeOnly:
      row.free_only ===
      true,

    updatedAt:
      row.updated_at,
  };
}

async function authenticate(
  request: Request,
) {
  const accessToken =
    getBearerToken(
      request,
    );

  if (
    !accessToken
  ) {
    return {
      error:
        "No autorizado.",

      status:
        401,

      profileId:
        null,

      supabaseAdmin:
        null,
    } as const;
  }

  const supabaseAdmin =
    getSupabaseAdminClient();

  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabaseAdmin
      .auth
      .getUser(
        accessToken,
      );

  if (
    authError ||
    !authData.user
  ) {
    return {
      error:
        "La sesión no es válida.",

      status:
        401,

      profileId:
        null,

      supabaseAdmin:
        null,
    } as const;
  }

  return {
    error:
      null,

    status:
      200,

    profileId:
      authData.user.id,

    supabaseAdmin,
  } as const;
}

export async function GET(
  request: Request,
) {
  try {
    const auth =
      await authenticate(
        request,
      );

    if (
      auth.error ||
      !auth.profileId ||
      !auth.supabaseAdmin
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ??
            "No autorizado.",
        },
        {
          status:
            auth.status,

          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      data,
      error,
    } =
      await auth.supabaseAdmin
        .from(
          "event_discovery_preferences",
        )
        .select(
          `
            profile_id,
            selected_city,
            selected_city_key,
            selected_province,
            country_code,
            selection_mode,
            intent_text,
            intent_expires_at,
            date_scope,
            date_from,
            date_to,
            categories,
            free_only,
            updated_at
          `,
        )
        .eq(
          "profile_id",
          auth.profileId,
        )
        .maybeSingle();

    if (
      error
    ) {
      throw new Error(
        `No se pudieron cargar las preferencias de eventos: ${error.message}`,
      );
    }

    let row =
      data as
        | PreferenceRow
        | null;

    /*
     * Limpieza diferida.
     *
     * No dejamos una intención caducada disponible para
     * futuras consultas semánticas.
     */
    if (
      row?.intent_text &&
      isEventDiscoveryIntentExpired(
        row.intent_expires_at,
      )
    ) {
      const {
        error:
          expireError,
      } =
        await auth.supabaseAdmin
          .from(
            "event_discovery_preferences",
          )
          .update({
            intent_text:
              null,

            intent_hash:
              null,

            intent_embedding:
              null,

            intent_model:
              null,

            intent_dimensions:
              null,

            intent_expires_at:
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "profile_id",
            auth.profileId,
          );

      if (
        expireError
      ) {
        console.error(
          "⚠️ No se pudo limpiar una intención caducada:",
          expireError,
        );
      } else {
        row = {
          ...row,

          intent_text:
            null,

          intent_expires_at:
            null,

          updated_at:
            new Date()
              .toISOString(),
        };
      }
    }

    return NextResponse.json(
      {
        preferences:
          mapPreferences(
            auth.profileId,
            row,
          ),
      },
      {
        status:
          200,

        headers:
          noStoreHeaders(),
      },
    );
  } catch (
    error
  ) {
    console.error(
      "❌ Error cargando preferencias de descubrimiento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar tus preferencias de eventos.",
      },
      {
        status:
          500,

        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const auth =
      await authenticate(
        request,
      );

    if (
      auth.error ||
      !auth.profileId ||
      !auth.supabaseAdmin
    ) {
      return NextResponse.json(
        {
          error:
            auth.error ??
            "No autorizado.",
        },
        {
          status:
            auth.status,

          headers:
            noStoreHeaders(),
        },
      );
    }

    let body:
      UpdatePreferencesBody | null =
      null;

    try {
      body =
        (await request.json()) as
          UpdatePreferencesBody;
    } catch {
      body =
        null;
    }

    if (
      !body
    ) {
      return NextResponse.json(
        {
          error:
            "No se recibieron preferencias válidas.",
        },
        {
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    const hasDateScope =
      Object.prototype.hasOwnProperty.call(
        body,
        "dateScope",
      );

    const hasIntentText =
      Object.prototype.hasOwnProperty.call(
        body,
        "intentText",
      );

    if (
      !hasDateScope &&
      !hasIntentText
    ) {
      return NextResponse.json(
        {
          error:
            "No hay cambios que guardar.",
        },
        {
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      hasDateScope &&
      !isEditableEventDiscoveryDateScope(
        body.dateScope,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El periodo seleccionado no es válido.",
        },
        {
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    let intentText:
      string | null =
      null;

    if (
      hasIntentText
    ) {
      if (
        typeof body.intentText !==
          "string" &&
        body.intentText !==
          null
      ) {
        return NextResponse.json(
          {
            error:
              "La intención actual no es válida.",
          },
          {
            status:
              400,

            headers:
              noStoreHeaders(),
          },
        );
      }

      try {
        intentText =
          normalizeEventDiscoveryIntentText(
            typeof body.intentText ===
              "string"
              ? body.intentText
              : "",
          );
      } catch (
        normalizationError
      ) {
        return NextResponse.json(
          {
            error:
              normalizationError instanceof
                Error
                ? normalizationError.message
                : "La intención actual no es válida.",
          },
          {
            status:
              400,

            headers:
              noStoreHeaders(),
          },
        );
      }
    }

    /*
     * ============================================================
     * PREFERENCIAS DETERMINISTAS
     * ============================================================
     */

    if (
      hasDateScope &&
      isEditableEventDiscoveryDateScope(
        body.dateScope,
      )
    ) {
      const {
        error:
          upsertError,
      } =
        await auth.supabaseAdmin
          .from(
            "event_discovery_preferences",
          )
          .upsert(
            {
              profile_id:
                auth.profileId,

              date_scope:
                body.dateScope,

              /*
               * El rango custom todavía no forma parte del MVP.
               * Evitamos conservar fechas antiguas incompatibles.
               */
              date_from:
                null,

              date_to:
                null,

              updated_at:
                new Date()
                  .toISOString(),
            },
            {
              onConflict:
                "profile_id",
            },
          );

      if (
        upsertError
      ) {
        throw new Error(
          `No se pudo guardar el periodo de descubrimiento: ${upsertError.message}`,
        );
      }
    }

    /*
     * ============================================================
     * INTENCIÓN TEMPORAL
     * ============================================================
     */

    if (
      hasIntentText
    ) {
      await syncEventDiscoveryIntent({
        profileId:
          auth.profileId,

        intentText,

        refreshExpiry:
          true,
      });
    }

    /*
     * Volvemos a leer PostgreSQL.
     *
     * Así la respuesta siempre representa exactamente
     * lo que terminó persistido.
     */

    const {
      data:
        updatedData,

      error:
        updatedError,
    } =
      await auth.supabaseAdmin
        .from(
          "event_discovery_preferences",
        )
        .select(
          `
            profile_id,
            selected_city,
            selected_city_key,
            selected_province,
            country_code,
            selection_mode,
            intent_text,
            intent_expires_at,
            date_scope,
            date_from,
            date_to,
            categories,
            free_only,
            updated_at
          `,
        )
        .eq(
          "profile_id",
          auth.profileId,
        )
        .maybeSingle();

    if (
      updatedError
    ) {
      throw new Error(
        `Las preferencias se guardaron pero no pudieron volver a cargarse: ${updatedError.message}`,
      );
    }

    return NextResponse.json(
      {
        preferences:
          mapPreferences(
            auth.profileId,
            updatedData as
              | PreferenceRow
              | null,
          ),
      },
      {
        status:
          200,

        headers:
          noStoreHeaders(),
      },
    );
  } catch (
    error
  ) {
    console.error(
      "❌ Error guardando preferencias de descubrimiento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron guardar tus preferencias de eventos.",
      },
      {
        status:
          500,

        headers:
          noStoreHeaders(),
      },
    );
  }
}