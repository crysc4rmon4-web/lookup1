import {
  NextResponse,
} from "next/server";

import {
  parseStoredLookupEmbedding,
} from "@/lib/ai/embedding";

import {
  calculateContextualEventRelevance,
  calculateEventRelevance,
  findExplicitEventInterestMatches,
  type EventRelevanceLevel,
} from "@/lib/ai/events/event-relevance";

import {
  EVENT_EMBEDDING_DIMENSIONS,
  EVENT_EMBEDDING_MODEL,
} from "@/lib/ai/events/semantic-event";

import {
  syncEventDiscoveryIntent,
} from "@/lib/ai/events/sync-event-discovery-intent";

import {
  syncProfileEmbedding,
} from "@/lib/ai/sync-profile-embedding";

import {
  getEventDiscoveryDateRange,
} from "@/lib/events/event-discovery-date-range";

import {
  isEventDiscoveryDateScope,
  isEventDiscoveryIntentExpired,
  type EventDiscoveryDateScope,
} from "@/lib/events/event-discovery-preferences";

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
  latitude: number | string | null;
  longitude: number | string | null;
  id: string;
  creator_profile_id: string;
  title: string;
  description: string;
  category: string;
  cover_image_url: string | null;
  tags: string[] | null;
  audience: string[] | null;
  venue_name: string;
  address: string;
  city: string;
  city_key: string | null;
  province: string | null;
  postal_code: string | null;
  country_code: string | null;
  start_at: string;
  end_at: string;
  status: string | null;
  is_free: boolean | null;
  price_from: number | null;
  currency: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
};

type CurrentProfileRow = {
  profession: string | null;
  bio: string | null;
  interests: string[] | null;
};

type DiscoveryPreferencesRow = {
  date_scope:
    string;

  date_from:
    string | null;

  date_to:
    string | null;

  intent_text:
    string | null;

  intent_expires_at:
    string | null;
};

type EventEmbeddingRow = {
  event_id:
    string;

  embedding:
    unknown;
};

type ExploreRelevance = {
  relevanceScore:
    number;

  relevanceLevel:
    EventRelevanceLevel;

  matchedInterests:
    string[];

  intentBoostApplied:
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

function normalizeList(
  value:
    string[] | null,
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
      (
        item,
      ) =>
        item.trim(),
    )
    .filter(Boolean);
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
  event:
    EventRow,
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
    startAt <=
      now &&
    endAt >=
      now
  ) {
    return "live";
  }

  return "upcoming";
}

function parseLimit(
  value:
    string | null,
) {
  if (
    !value
  ) {
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
  event:
    EventRow,
) {
  return {
    latitude: event.latitude == null ? null : Number(event.latitude),
    longitude: event.longitude == null ? null : Number(event.longitude),
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
    const accessToken =
      getBearerToken(
        request,
      );

    if (
      !accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status:
            401,

          headers:
            noStoreHeaders(),
        },
      );
    }

    const supabaseAdmin =
      getSupabaseAdminClient();

    const {
      data:
        authData,

      error:
        authError,
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
          status:
            401,

          headers:
            noStoreHeaders(),
        },
      );
    }

    const currentProfileId =
      authData.user.id;

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

    const province = url.searchParams.get("province")?.trim();
    if (province && (province.length > 120 || /[%_]/.test(province))) {
      return NextResponse.json({ error: "Provincia no válida." }, { status: 400, headers: noStoreHeaders() });
    }

    const mapView = url.searchParams.get("view") === "map";
    const offset = Number(url.searchParams.get("offset") ?? "0");
    if (mapView && (!Number.isSafeInteger(offset) || offset < 0)) {
      return NextResponse.json({ error: "Página no válida." }, { status: 400, headers: noStoreHeaders() });
    }

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
          status:
            400,

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
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * PREFERENCIAS DE DESCUBRIMIENTO
     * ============================================================
     */

    let preferences:
      DiscoveryPreferencesRow | null =
      null;

    if (!mapView) {
      try {
        const {
          data:
            preferencesData,

          error:
            preferencesError,
        } =
          await supabaseAdmin
            .from(
              "event_discovery_preferences",
            )
            .select(
              `
                date_scope,
                date_from,
                date_to,
                intent_text,
                intent_expires_at
              `,
            )
            .eq(
              "profile_id",
              currentProfileId,
            )
            .maybeSingle();

        if (
          preferencesError
        ) {
          throw new Error(
            preferencesError.message,
          );
        }

        preferences =
          preferencesData as
            | DiscoveryPreferencesRow
            | null;
      } catch (
        preferencesError
      ) {
        /*
         * Una preferencia nunca debe romper Explorar.
         */
        console.error(
          "⚠️ Explorar continuará con preferencias por defecto:",
          preferencesError,
        );
      }

    }

    const dateScope:
      EventDiscoveryDateScope =
      preferences &&
      isEventDiscoveryDateScope(
        preferences.date_scope,
      )
        ? preferences.date_scope
        : "all";

    const dateRange =
      getEventDiscoveryDateRange({
        scope:
          dateScope,

        dateFrom:
          preferences
            ?.date_from ??
          null,

        dateTo:
          preferences
            ?.date_to ??
          null,
      });

    const cityKey =
      normalizeLocationKey(
        city,
      );

    /*
     * ============================================================
     * EVENTOS
     * ============================================================
     *
     * Seleccionamos eventos que se solapan con la ventana:
     *
     * end_at > inicio
     * start_at < final
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
            latitude,
            longitude,
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
          dateRange.fromIso,
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

    if (province) query = query.ilike("province", province);

    if (mapView) {
      query = query.order("id", { ascending: true }).range(offset, offset + limit - 1);
    }

    if (
      dateRange.toIso
    ) {
      query =
        query.lt(
          "start_at",
          dateRange.toIso,
        );
    }

    if (
      category
    ) {
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

    if (
      error
    ) {
      throw new Error(
        `No se pudieron cargar los eventos publicados: ${error.message}`,
      );
    }

    const eventRows =
      (
        data ??
        []
      ) as EventRow[];

    if (mapView) {
      const events = eventRows.map((event) => ({
        ...mapEvent(event), isFavorite: false, canFavorite: false,
        relevanceScore: null, relevanceLevel: null, matchedInterests: [],
      }));
      return NextResponse.json({ city, cityKey, events, count: events.length }, { headers: noStoreHeaders() });
    }

    if (
      eventRows.length ===
      0
    ) {
      return NextResponse.json(
        {
          city,

          cityKey,

          dateScope,

          events:
            [],

          count:
            0,
        },
        {
          status:
            200,

          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * FAVORITOS
     * ============================================================
     */

    const {
      data:
        favoriteData,

      error:
        favoriteError,
    } =
      await supabaseAdmin
        .from(
          "event_favorites",
        )
        .select(
          "event_id",
        )
        .eq(
          "profile_id",
          currentProfileId,
        )
        .in(
          "event_id",
          eventRows.map(
            (
              event,
            ) =>
              event.id,
          ),
        );

    if (
      favoriteError
    ) {
      throw new Error(
        `No se pudieron comprobar los favoritos: ${favoriteError.message}`,
      );
    }

    const favoriteEventIds =
      new Set<string>();

    for (
      const favorite
      of favoriteData ??
      []
    ) {
      if (
        typeof favorite.event_id ===
        "string"
      ) {
        favoriteEventIds.add(
          favorite.event_id,
        );
      }
    }

    /*
     * ============================================================
     * RELEVANCIA · PERFIL + INTENCIÓN ACTUAL
     * ============================================================
     */

    const relevanceByEventId =
      new Map<
        string,
        ExploreRelevance
      >();

    try {
      let currentProfile:
        CurrentProfileRow | null =
        null;

      const {
        data:
          currentProfileData,

        error:
          currentProfileError,
      } =
        await supabaseAdmin
          .from(
            "profiles",
          )
          .select(
            `
              profession,
              bio,
              interests
            `,
          )
          .eq(
            "id",
            currentProfileId,
          )
          .maybeSingle();

      if (
        currentProfileError
      ) {
        console.error(
          "⚠️ No se pudo cargar el perfil para relevancia:",
          currentProfileError,
        );
      } else {
        currentProfile =
          currentProfileData as
            | CurrentProfileRow
            | null;
      }

      const profileInterests =
        normalizeList(
          currentProfile
            ?.interests ??
          null,
        );

      let profileVector:
        number[] | null =
        null;

      if (
        currentProfile
      ) {
        try {
          const profileEmbedding =
            await syncProfileEmbedding({
              profileId:
                currentProfileId,

              profession:
                currentProfile.profession,

              bio:
                currentProfile.bio,

              interests:
                profileInterests,
            });

          if (
            profileEmbedding.embeddingText
          ) {
            profileVector =
              parseStoredLookupEmbedding(
                profileEmbedding.embeddingText,
              );
          }
        } catch (
          profileEmbeddingError
        ) {
          console.error(
            "⚠️ Explorar continuará sin relevancia permanente de perfil:",
            profileEmbeddingError,
          );
        }
      }

      let intentVector:
        number[] | null =
        null;

      const activeIntentText =
        preferences
          ?.intent_text
          ?.trim() ??
        "";

      const intentIsActive =
        Boolean(
          activeIntentText,
        ) &&
        !isEventDiscoveryIntentExpired(
          preferences
            ?.intent_expires_at ??
          null,
        );

      if (
        intentIsActive
      ) {
        try {
          const intentEmbedding =
            await syncEventDiscoveryIntent({
              profileId:
                currentProfileId,

              intentText:
                activeIntentText,

              refreshExpiry:
                false,
            });

          if (
            intentEmbedding.embeddingText
          ) {
            intentVector =
              parseStoredLookupEmbedding(
                intentEmbedding.embeddingText,
              );
          }
        } catch (
          intentError
        ) {
          console.error(
            "⚠️ Explorar continuará sin intención temporal:",
            intentError,
          );
        }
      }

      if (
        profileVector ||
        intentVector
      ) {
        const {
          data:
            eventEmbeddingData,

          error:
            eventEmbeddingError,
        } =
          await supabaseAdmin
            .from(
              "event_embeddings",
            )
            .select(
              `
                event_id,
                embedding
              `,
            )
            .in(
              "event_id",
              eventRows.map(
                (
                  event,
                ) =>
                  event.id,
              ),
            )
            .eq(
              "model",
              EVENT_EMBEDDING_MODEL,
            )
            .eq(
              "dimensions",
              EVENT_EMBEDDING_DIMENSIONS,
            );

        if (
          eventEmbeddingError
        ) {
          throw new Error(
            `No se pudieron cargar los embeddings de eventos: ${eventEmbeddingError.message}`,
          );
        }

        const eventById =
          new Map(
            eventRows.map(
              (
                event,
              ) => [
                event.id,
                event,
              ],
            ),
          );

        for (
          const embeddingRow
          of (
            eventEmbeddingData ??
            []
          ) as EventEmbeddingRow[]
        ) {
          const event =
            eventById.get(
              embeddingRow.event_id,
            );

          /*
           * Nunca recomendamos al creador
           * su propio evento.
           */
          if (
            !event ||
            event.creator_profile_id ===
              currentProfileId
          ) {
            continue;
          }

          try {
            const eventVector =
              parseStoredLookupEmbedding(
                embeddingRow.embedding,
              );

            const profileRelevanceScore =
              profileVector
                ? calculateEventRelevance(
                    profileVector,
                    eventVector,
                  ).relevanceScore
                : null;

            const intentRelevanceScore =
              intentVector
                ? calculateEventRelevance(
                    intentVector,
                    eventVector,
                  ).relevanceScore
                : null;

            const contextualRelevance =
              calculateContextualEventRelevance({
                profileRelevanceScore,

                intentRelevanceScore,
              });

            if (
              !contextualRelevance
            ) {
              continue;
            }

            relevanceByEventId.set(
              event.id,
              {
                relevanceScore:
                  contextualRelevance.relevanceScore,

                relevanceLevel:
                  contextualRelevance.level,

                intentBoostApplied:
                  contextualRelevance.intentBoostApplied,

                matchedInterests:
                  findExplicitEventInterestMatches({
                    profileInterests,

                    category:
                      event.category,

                    tags:
                      normalizeList(
                        event.tags,
                      ),

                    audience:
                      normalizeList(
                        event.audience,
                      ),
                  }),
              },
            );
          } catch (
            vectorError
          ) {
            console.error(
              `⚠️ No se pudo calcular relevancia para el evento ${embeddingRow.event_id}:`,
              vectorError,
            );
          }
        }
      }
    } catch (
      relevanceError
    ) {
      console.error(
        "⚠️ Explorar continuará sin relevancia semántica:",
        relevanceError,
      );
    }

    const events =
      eventRows.map(
        (
          event,
        ) => {
          const relevance =
            relevanceByEventId.get(
              event.id,
            );

          return {
            ...mapEvent(
              event,
            ),

            isFavorite:
              favoriteEventIds.has(
                event.id,
              ),

            canFavorite:
              event.creator_profile_id !==
              currentProfileId,

            relevanceScore:
              relevance
                ?.relevanceScore ??
              null,

            relevanceLevel:
              relevance
                ?.relevanceLevel ??
              null,

            matchedInterests:
              relevance
                ?.matchedInterests ??
              [],

            intentBoostApplied:
              relevance
                ?.intentBoostApplied ??
              false,
          };
        },
      );

    return NextResponse.json(
      {
        city,

        cityKey,

        dateScope,

        events,

        count:
          events.length,
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
      "❌ Error cargando feed público de eventos:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los eventos de esta ciudad.",
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