import {
  NextResponse,
} from "next/server";

import {
  parseStoredLookupEmbedding,
} from "@/lib/ai/embedding";

import {
  buildFallbackEventMatchExplanation,
  generateEventMatchExplanation,
  type EventMatchExplanationInput,
} from "@/lib/ai/events/event-match-explanation";

import {
  calculateContextualEventRelevance,
  calculateEventRelevance,
  findExplicitEventInterestMatches,
} from "@/lib/ai/events/event-relevance";

import {
  syncEventDiscoveryIntent,
} from "@/lib/ai/events/sync-event-discovery-intent";

import {
  syncEventEmbedding,
} from "@/lib/ai/events/sync-event-embedding";

import {
  syncProfileEmbedding,
} from "@/lib/ai/sync-profile-embedding";

import {
  isEventDiscoveryIntentExpired,
} from "@/lib/events/event-discovery-preferences";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type CurrentProfileRow = {
  id:
    string;

  profession:
    string | null;

  bio:
    string | null;

  interests:
    string[] | null;
};

type PublicEventRow = {
  id:
    string;

  creator_profile_id:
    string;

  title:
    string;

  description:
    string;

  category:
    string;

  tags:
    string[] | null;

  audience:
    string[] | null;

  start_at:
    string;

  end_at:
    string;

  status:
    string | null;
};

type DiscoveryIntentRow = {
  intent_text:
    string | null;

  intent_expires_at:
    string | null;
};

type EventMatchUnavailableReason =
  | "own_event"
  | "ended"
  | "missing_profile_context"
  | "temporarily_unavailable";

function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getBearerToken(
  request:
    Request,
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

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
}

function createUnavailablePayload(
  reason:
    EventMatchUnavailableReason,
) {
  return {
    available:
      false,

    relevanceScore:
      null,

    relevanceLevel:
      null,

    matchedInterests:
      [],

    explanation:
      null,

    source:
      "unavailable" as const,

    model:
      null,

    reason,
  };
}

export async function POST(
  request:
    Request,
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
      await supabaseAdmin
        .auth
        .getUser(
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

    let requestBody:
      | {
          eventId?: unknown;
        }
      | null =
      null;

    try {
      requestBody =
        (await request.json()) as {
          eventId?: unknown;
        };
    } catch {
      requestBody =
        null;
    }

    const eventId =
      typeof requestBody
        ?.eventId ===
        "string"
        ? requestBody.eventId.trim()
        : "";

    if (
      !eventId ||
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
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    const currentProfileId =
      authData.user.id;

    /*
     * ============================================================
     * CONTEXTO REAL
     * ============================================================
     */

    const [
      currentProfileResult,
      eventResult,
      intentResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .from(
            "profiles",
          )
          .select(
            `
              id,
              profession,
              bio,
              interests
            `,
          )
          .eq(
            "id",
            currentProfileId,
          )
          .maybeSingle(),

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
              tags,
              audience,
              start_at,
              end_at,
              status
            `,
          )
          .eq(
            "id",
            eventId,
          )
          .eq(
            "status",
            "published",
          )
          .maybeSingle(),

        supabaseAdmin
          .from(
            "event_discovery_preferences",
          )
          .select(
            `
              intent_text,
              intent_expires_at
            `,
          )
          .eq(
            "profile_id",
            currentProfileId,
          )
          .maybeSingle(),
      ]);

    if (
      currentProfileResult.error
    ) {
      throw new Error(
        `No se pudo cargar el perfil actual: ${currentProfileResult.error.message}`,
      );
    }

    if (
      eventResult.error
    ) {
      throw new Error(
        `No se pudo cargar el evento: ${eventResult.error.message}`,
      );
    }

    if (
      intentResult.error
    ) {
      /*
       * La intención es complementaria.
       */
      console.error(
        "⚠️ No se pudo cargar la intención actual:",
        intentResult.error,
      );
    }

    const currentProfile =
      currentProfileResult.data as
        | CurrentProfileRow
        | null;

    const event =
      eventResult.data as
        | PublicEventRow
        | null;

    const discoveryIntent =
      intentResult.error
        ? null
        : intentResult.data as
            | DiscoveryIntentRow
            | null;

    if (
      !currentProfile
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo cargar tu perfil.",
        },
        {
          status:
            404,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !event
    ) {
      return NextResponse.json(
        {
          error:
            "El evento solicitado no está disponible.",
        },
        {
          status:
            404,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      event.creator_profile_id ===
      currentProfileId
    ) {
      return NextResponse.json(
        createUnavailablePayload(
          "own_event",
        ),
        {
          headers:
            noStoreHeaders(),
        },
      );
    }

    const eventEndAt =
      new Date(
        event.end_at,
      ).getTime();

    if (
      Number.isFinite(
        eventEndAt,
      ) &&
      eventEndAt <
        Date.now()
    ) {
      return NextResponse.json(
        createUnavailablePayload(
          "ended",
        ),
        {
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * VECTOR DEL EVENTO
     * ============================================================
     *
     * Sin él no podemos comparar ni perfil ni intención.
     */

    let eventVector:
      number[];

    try {
      const eventEmbedding =
        await syncEventEmbedding({
          eventId:
            event.id,

          title:
            event.title,

          description:
            event.description,

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
        });

      eventVector =
        parseStoredLookupEmbedding(
          eventEmbedding.embeddingText,
        );
    } catch (
      eventEmbeddingError
    ) {
      console.error(
        "❌ No se pudo preparar el embedding del evento:",
        eventEmbeddingError,
      );

      return NextResponse.json(
        createUnavailablePayload(
          "temporarily_unavailable",
        ),
        {
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * PERFIL PERMANENTE
     * ============================================================
     */

    const profileInterests =
      normalizeList(
        currentProfile.interests,
      );

    let profileRelevanceScore:
      number | null =
      null;

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
        const profileVector =
          parseStoredLookupEmbedding(
            profileEmbedding.embeddingText,
          );

        profileRelevanceScore =
          calculateEventRelevance(
            profileVector,
            eventVector,
          ).relevanceScore;
      }
    } catch (
      profileError
    ) {
      console.error(
        "⚠️ El análisis continuará sin embedding permanente de perfil:",
        profileError,
      );
    }

    /*
     * ============================================================
     * INTENCIÓN ACTUAL
     * ============================================================
     */

    let intentRelevanceScore:
      number | null =
      null;

    let currentIntentText:
      string | null =
      null;

    const storedIntentText =
      discoveryIntent
        ?.intent_text
        ?.trim() ??
      "";

    const intentIsActive =
      Boolean(
        storedIntentText,
      ) &&
      !isEventDiscoveryIntentExpired(
        discoveryIntent
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
              storedIntentText,

            refreshExpiry:
              false,
          });

        if (
          intentEmbedding.embeddingText
        ) {
          const intentVector =
            parseStoredLookupEmbedding(
              intentEmbedding.embeddingText,
            );

          intentRelevanceScore =
            calculateEventRelevance(
              intentVector,
              eventVector,
            ).relevanceScore;

          currentIntentText =
            storedIntentText;
        }
      } catch (
        intentError
      ) {
        console.error(
          "⚠️ El análisis continuará sin intención temporal:",
          intentError,
        );
      }
    }

    /*
     * ============================================================
     * RELEVANCIA CONTEXTUAL
     * ============================================================
     */

    const relevance =
      calculateContextualEventRelevance({
        profileRelevanceScore,

        intentRelevanceScore,
      });

    if (
      !relevance
    ) {
      return NextResponse.json(
        createUnavailablePayload(
          "missing_profile_context",
        ),
        {
          headers:
            noStoreHeaders(),
        },
      );
    }

    const eventTags =
      normalizeList(
        event.tags,
      );

    const eventAudience =
      normalizeList(
        event.audience,
      );

    const matchedInterests =
      findExplicitEventInterestMatches({
        profileInterests,

        category:
          event.category,

        tags:
          eventTags,

        audience:
          eventAudience,
      });

    const explanationInput:
      EventMatchExplanationInput =
      {
        relevanceScore:
          relevance.relevanceScore,

        profileRelevanceScore:
          relevance.profileRelevanceScore,

        intentBoostApplied:
          relevance.intentBoostApplied,

        currentIntent:
          currentIntentText &&
          intentRelevanceScore !==
            null
            ? {
                text:
                  currentIntentText,

                relevanceScore:
                  intentRelevanceScore,
              }
            : null,

        matchedInterests,

        currentProfile: {
          profession:
            currentProfile.profession,

          bio:
            currentProfile.bio,

          interests:
            profileInterests,
        },

        event: {
          title:
            event.title,

          description:
            event.description,

          category:
            event.category,

          tags:
            eventTags,

          audience:
            eventAudience,
        },
      };

    const fallbackExplanation =
      buildFallbackEventMatchExplanation(
        explanationInput,
      );

    try {
      const generated =
        await generateEventMatchExplanation(
          explanationInput,
        );

      return NextResponse.json(
        {
          available:
            true,

          relevanceScore:
            relevance.relevanceScore,

          relevanceLevel:
            relevance.level,

          matchedInterests,

          explanation:
            generated.explanation,

          source:
            "ai",

          model:
            generated.model,

          reason:
            null,
        },
        {
          headers:
            noStoreHeaders(),
        },
      );
    } catch (
      aiError
    ) {
      console.error(
        "❌ No se pudo generar la explicación de relevancia del evento:",
        aiError,
      );

      return NextResponse.json(
        {
          available:
            true,

          relevanceScore:
            relevance.relevanceScore,

          relevanceLevel:
            relevance.level,

          matchedInterests,

          explanation:
            fallbackExplanation,

          source:
            "fallback",

          model:
            null,

          reason:
            null,
        },
        {
          headers:
            noStoreHeaders(),
        },
      );
    }
  } catch (
    error
  ) {
    console.error(
      "❌ Error explicando relevancia Persona ↔ Evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo analizar la relevancia de este evento.",
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