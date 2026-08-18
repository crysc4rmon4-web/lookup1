import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

import {
  calculateEventReadiness,
} from "@/lib/ai/events/event-readiness";

import {
  syncEventEmbedding,
} from "@/lib/ai/events/sync-event-embedding";

import {
  buildFallbackEventPrepublishAdvice,
  generateEventPrepublishAdvice,
  type EventPrepublishIntelligenceInput,
} from "@/lib/ai/events/event-intelligence";

import type {
  EventDraftIntelligenceResult,
  EventLocalAudiencePreview,
} from "@/lib/events/event-intelligence-types";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DraftEventRow = {
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
    string[];

  audience:
    string[];

  venue_name:
    string;

  address:
    string;

  city:
    string;

  province:
    string;

  start_at:
    string;

  end_at:
    string;

  status:
    string;

  is_free:
    boolean;

  price_from:
    number | null;

  external_url:
    string | null;

  external_action_label:
    string | null;
};

type AudienceRpcRow = {
  sample_status:
    string;

  analyzed_profiles:
    number | null;

  related_profiles:
    number | null;

  strong_profiles:
    number | null;

  average_similarity:
    number | null;

  top_interests:
    string[] | null;
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

function normalizeStringArray(
  value:
    | string[]
    | null
    | undefined,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
}

function normalizeAudiencePreview(
  row:
    | AudienceRpcRow
    | null,
): EventLocalAudiencePreview {
  if (!row) {
    return {
      sampleStatus:
        "unavailable",

      analyzedProfiles:
        null,

      relatedProfiles:
        null,

      strongProfiles:
        null,

      averageSimilarity:
        null,

      topInterests:
        [],
    };
  }

  const allowedStatuses =
    new Set([
      "sufficient",
      "insufficient_sample",
      "insufficient_related_sample",
      "no_local_data",
    ]);

  const sampleStatus =
    allowedStatuses.has(
      row.sample_status,
    )
      ? (row.sample_status as
          EventLocalAudiencePreview["sampleStatus"])
      : "unavailable";

  return {
    sampleStatus,

    analyzedProfiles:
      typeof row.analyzed_profiles ===
      "number"
        ? row.analyzed_profiles
        : null,

    relatedProfiles:
      typeof row.related_profiles ===
      "number"
        ? row.related_profiles
        : null,

    strongProfiles:
      typeof row.strong_profiles ===
      "number"
        ? row.strong_profiles
        : null,

    averageSimilarity:
      typeof row.average_similarity ===
      "number"
        ? row.average_similarity
        : null,

    topInterests:
      normalizeStringArray(
        row.top_interests,
      ),
  };
}

export async function POST(
  request: Request,
  context: RouteContext,
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
     * 2. EVENT ID
     * ==========================================================
     */

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

    /*
     * ==========================================================
     * 3. DRAFT REAL Y PROPIEDAD
     * ==========================================================
     *
     * Nadie puede solicitar Intelligence
     * para el borrador de otra persona.
     */

    const {
      data: eventData,
      error: eventError,
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
            start_at,
            end_at,
            status,
            is_free,
            price_from,
            external_url,
            external_action_label
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

    if (eventError) {
      throw new Error(
        `No se pudo cargar el borrador: ${eventError.message}`,
      );
    }

    const event =
      eventData as
        | DraftEventRow
        | null;

    if (!event) {
      return NextResponse.json(
        {
          error:
            "El borrador no existe o no te pertenece.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      event.status !==
      "draft"
    ) {
      return NextResponse.json(
        {
          error:
            "LookUp Intelligence pre-publicación solo está disponible para borradores.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ==========================================================
     * 4. READINESS DETERMINISTA
     * ==========================================================
     *
     * Esto NO depende de OpenAI.
     */

    const readiness =
      calculateEventReadiness({
        title:
          event.title,

        description:
          event.description,

        category:
          event.category,

        tags:
          normalizeStringArray(
            event.tags,
          ),

        audience:
          normalizeStringArray(
            event.audience,
          ),

        venueName:
          event.venue_name,

        address:
          event.address,

        city:
          event.city,

        province:
          event.province,

        startAt:
          event.start_at,

        endAt:
          event.end_at,

        isFree:
          event.is_free,

        priceFrom:
          event.price_from,

        externalUrl:
          event.external_url,

        externalActionLabel:
          event.external_action_label,
      });

    /*
     * ==========================================================
     * 5. EVENT EMBEDDING
     * ==========================================================
     */

    let embeddingPublicStatus:
      EventDraftIntelligenceResult["embedding"] =
      {
        status:
          "unavailable",

        model:
          null,

        dimensions:
          null,
      };

    let embeddingText:
      string | null =
      null;

    try {
      const embeddingResult =
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
            normalizeStringArray(
              event.tags,
            ),

          audience:
            normalizeStringArray(
              event.audience,
            ),
        });

      embeddingText =
        embeddingResult.embeddingText;

      embeddingPublicStatus =
        {
          status:
            embeddingResult.status,

          model:
            embeddingResult.model,

          dimensions:
            embeddingResult.dimensions,
        };
    } catch (
      embeddingError
    ) {
      console.error(
        "❌ No se pudo sincronizar el embedding del evento:",
        embeddingError,
      );
    }

    /*
     * ==========================================================
     * 6. AUDIENCIA LOCAL AGREGADA
     * ==========================================================
     *
     * Solo si existe embedding.
     *
     * El RPC:
     * - nunca devuelve IDs
     * - nunca devuelve perfiles individuales
     * - protege muestras pequeñas
     */

    let localAudience:
      EventLocalAudiencePreview =
      {
        sampleStatus:
          "unavailable",

        analyzedProfiles:
          null,

        relatedProfiles:
          null,

        strongProfiles:
          null,

        averageSimilarity:
          null,

        topInterests:
          [],
      };

    if (embeddingText) {
      try {
        const {
          data:
            audienceData,
          error:
            audienceError,
        } =
          await supabaseAdmin.rpc(
            "get_event_local_audience_preview",
            {
              p_creator_profile_id:
                authData.user.id,

              p_city:
                event.city,

              p_event_embedding_text:
                embeddingText,
            },
          );

        if (audienceError) {
          throw new Error(
            audienceError.message,
          );
        }

        const rows =
          (audienceData ??
            []) as AudienceRpcRow[];

        localAudience =
          normalizeAudiencePreview(
            rows[0] ??
              null,
          );
      } catch (
        audienceError
      ) {
        console.error(
          "❌ No se pudo calcular la audiencia local del evento:",
          audienceError,
        );
      }
    }

    /*
     * ==========================================================
     * 7. EVIDENCE OBJECT
     * ==========================================================
     *
     * GPT recibe únicamente:
     *
     * evento
     * readiness
     * agregados locales
     *
     * Nunca recibe perfiles individuales.
     */

    const intelligenceInput:
      EventPrepublishIntelligenceInput =
      {
        event: {
          title:
            event.title,

          description:
            event.description,

          category:
            event.category,

          tags:
            normalizeStringArray(
              event.tags,
            ),

          audience:
            normalizeStringArray(
              event.audience,
            ),

          city:
            event.city,

          startAt:
            event.start_at,

          endAt:
            event.end_at,

          isFree:
            event.is_free,

          priceFrom:
            event.price_from,

          externalUrl:
            event.external_url,
        },

        readiness,

        localAudience,
      };

    /*
     * ==========================================================
     * 8. FALLBACK PRIMERO
     * ==========================================================
     */

    const fallbackAdvice =
      buildFallbackEventPrepublishAdvice(
        intelligenceInput,
      );

    let advice =
      fallbackAdvice;

    /*
     * ==========================================================
     * 9. GPT
     * ==========================================================
     */

    try {
      advice =
        await generateEventPrepublishAdvice(
          intelligenceInput,
        );
    } catch (
      aiError
    ) {
      console.error(
        "❌ No se pudo generar LookUp Intelligence pre-publicación:",
        aiError,
      );
    }

    /*
     * ==========================================================
     * 10. PERSISTIR INSIGHT
     * ==========================================================
     *
     * Conservamos únicamente el análisis
     * prepublish más reciente.
     */

    const {
      error:
        deleteInsightError,
    } =
      await supabaseAdmin
        .from(
          "event_insights",
        )
        .delete()
        .eq(
          "event_id",
          event.id,
        )
        .eq(
          "phase",
          "prepublish",
        );

    if (
      deleteInsightError
    ) {
      throw new Error(
        `No se pudo reemplazar el insight anterior: ${deleteInsightError.message}`,
      );
    }

    const evidence = {
      readiness: {
        score:
          readiness.score,

        status:
          readiness.status,

        checks:
          readiness.checks,

        strengths:
          readiness.strengths,

        improvements:
          readiness.improvements,
      },

      localAudience,

      embedding: {
        status:
          embeddingPublicStatus.status,

        model:
          embeddingPublicStatus.model,

        dimensions:
          embeddingPublicStatus.dimensions,
      },
    };

    const {
      error:
        insertInsightError,
    } =
      await supabaseAdmin
        .from(
          "event_insights",
        )
        .insert({
          event_id:
            event.id,

          phase:
            "prepublish",

          verdict:
            advice.verdict,

          confidence:
            advice.confidence,

          title:
            advice.title,

          message:
            advice.message,

          recommendation:
            advice.recommendation,

          evidence,

          model:
            advice.model,
        });

    if (
      insertInsightError
    ) {
      throw new Error(
        `No se pudo guardar LookUp Intelligence: ${insertInsightError.message}`,
      );
    }

    /*
     * ==========================================================
     * 11. RESPUESTA
     * ==========================================================
     */

    const result:
      EventDraftIntelligenceResult =
      {
        eventId:
          event.id,

        readiness: {
          score:
            readiness.score,

          status:
            readiness.status,

          checks:
            readiness.checks,

          strengths:
            readiness.strengths,

          improvements:
            readiness.improvements,
        },

        localAudience,

        advice,

        embedding:
          embeddingPublicStatus,

        generatedAt:
          new Date().toISOString(),
      };

    return NextResponse.json(
      result,
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error generando LookUp Intelligence:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo analizar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}