import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

import type {
  EventDraftIntelligenceResult,
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

type InsightRow = {
  verdict:
    EventDraftIntelligenceResult["advice"]["verdict"];

  confidence:
    EventDraftIntelligenceResult["advice"]["confidence"];

  title:
    string;

  message:
    string;

  recommendation:
    string | null;

  evidence: {
    readiness:
      EventDraftIntelligenceResult["readiness"];

    localAudience:
      EventDraftIntelligenceResult["localAudience"];

    embedding:
      EventDraftIntelligenceResult["embedding"];
  };

  model:
    string | null;

  created_at:
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

  return (
    authorization
      .slice(7)
      .trim() ||
    null
  );
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

    /*
     * Comprobamos primero que el evento existe
     * y pertenece al usuario autenticado.
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
          "id",
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
        `No se pudo comprobar el evento: ${eventError.message}`,
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

    /*
     * Recuperamos el análisis pre-publicación
     * ya almacenado.
     *
     * Aquí NO llamamos a OpenAI.
     */
    const {
      data: insightData,
      error: insightError,
    } =
      await supabaseAdmin
        .from(
          "event_insights",
        )
        .select(
          `
            verdict,
            confidence,
            title,
            message,
            recommendation,
            evidence,
            model,
            created_at
          `,
        )
        .eq(
          "event_id",
          eventId,
        )
        .eq(
          "phase",
          "prepublish",
        )
        .maybeSingle();

    if (insightError) {
      throw new Error(
        `No se pudo recuperar Intelligence: ${insightError.message}`,
      );
    }

    /*
     * Que todavía no exista Intelligence
     * no es un error.
     */
    if (!insightData) {
      return NextResponse.json(
        {
          intelligence:
            null,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const insight =
      insightData as unknown as InsightRow;

    const result:
      EventDraftIntelligenceResult =
      {
        eventId,

        readiness:
          insight.evidence
            .readiness,

        localAudience:
          insight.evidence
            .localAudience,

        advice: {
          verdict:
            insight.verdict,

          confidence:
            insight.confidence,

          title:
            insight.title,

          message:
            insight.message,

          recommendation:
            insight.recommendation,

          source:
            insight.model
              ? "ai"
              : "fallback",

          model:
            insight.model,
        },

        embedding:
          insight.evidence
            .embedding,

        generatedAt:
          insight.created_at,
      };

    return NextResponse.json(
      {
        intelligence:
          result,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error recuperando LookUp Intelligence:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo recuperar LookUp Intelligence.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}