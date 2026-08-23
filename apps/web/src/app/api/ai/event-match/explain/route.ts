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
  calculateEventRelevance,
  findExplicitEventInterestMatches,
} from "@/lib/ai/events/event-relevance";

import {
  syncEventEmbedding,
} from "@/lib/ai/events/sync-event-embedding";

import {
  syncProfileEmbedding,
} from "@/lib/ai/sync-profile-embedding";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type CurrentProfileRow = {
  id: string;

  profession:
    string | null;

  bio:
    string | null;

  interests:
    string[] | null;

  onboarding_completed:
    boolean;
};

type PublicEventRow = {
  id: string;

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
  request: Request,
) {
  try {
    /*
     * ============================================================
     * 1. AUTENTICACIÓN
     * ============================================================
     */

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

    /*
     * ============================================================
     * 2. EVENT ID
     * ============================================================
     */

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
     * 3. CONTEXTO REAL
     * ============================================================
     *
     * No confiamos en información enviada por el navegador.
     *
     * Perfil y evento se vuelven a consultar directamente
     * desde PostgreSQL.
     */

    const [
      currentProfileResult,
      eventResult,
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
              interests,
              onboarding_completed
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

    const currentProfile =
      currentProfileResult.data as
        | CurrentProfileRow
        | null;

    const event =
      eventResult.data as
        | PublicEventRow
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

    /*
     * La relevancia de un evento propio no aporta valor
     * al creador.
     */
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
     * 4. SINCRONIZAR REPRESENTACIONES SEMÁNTICAS
     * ============================================================
     *
     * Ambas funciones utilizan cache por semantic_hash.
     *
     * Si nada cambió:
     * no existe ninguna llamada nueva de embeddings a OpenAI.
     */

    let profileEmbeddingText:
      string | null =
      null;

    let eventEmbeddingText:
      string | null =
      null;

    try {
      const [
        profileEmbedding,
        eventEmbedding,
      ] =
        await Promise.all([
          syncProfileEmbedding({
            profileId:
              currentProfileId,

            profession:
              currentProfile.profession,

            bio:
              currentProfile.bio,

            interests:
              normalizeList(
                currentProfile.interests,
              ),
          }),

          syncEventEmbedding({
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
          }),
        ]);

      profileEmbeddingText =
        profileEmbedding.embeddingText;

      eventEmbeddingText =
        eventEmbedding.embeddingText;
    } catch (
      embeddingError
    ) {
      /*
       * LookUp Intelligence es una capacidad adicional.
       *
       * Si OpenAI o la sincronización semántica fallan,
       * nunca rompemos el detalle público del evento.
       */
      console.error(
        "❌ No se pudo preparar la relevancia semántica del evento:",
        embeddingError,
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

    if (
      !profileEmbeddingText
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

    /*
     * ============================================================
     * 5. RELEVANCIA DETERMINISTA
     * ============================================================
     */

    const profileEmbedding =
      parseStoredLookupEmbedding(
        profileEmbeddingText,
      );

    const eventEmbedding =
      parseStoredLookupEmbedding(
        eventEmbeddingText,
      );

    const relevance =
      calculateEventRelevance(
        profileEmbedding,
        eventEmbedding,
      );

    const profileInterests =
      normalizeList(
        currentProfile.interests,
      );

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

    /*
     * ============================================================
     * 6. CONTEXTO PARA LOOKUP INTELLIGENCE
     * ============================================================
     */

    const explanationInput:
      EventMatchExplanationInput =
      {
        relevanceScore:
          relevance.relevanceScore,

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

    /*
     * Siempre construimos primero el fallback.
     *
     * Así GPT nunca es un punto único de fallo.
     */
    const fallbackExplanation =
      buildFallbackEventMatchExplanation(
        explanationInput,
      );

    /*
     * ============================================================
     * 7. EXPLICACIÓN HUMANA
     * ============================================================
     */

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