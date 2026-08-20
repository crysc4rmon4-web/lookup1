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

  return authorization
    .slice(7)
    .trim() ||
    null;
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

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const token =
      getBearerToken(
        request,
      );

    if (!token) {
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
      id: rawId,
    } =
      await context.params;

    const eventId =
      rawId.trim();

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
        token,
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
      data: event,
      error: eventError,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .select(
          `
            id,
            status,
            start_at
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
        eventError.message,
      );
    }

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

    if (
      event.status !==
      "draft"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo los borradores pueden publicarse.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const startAt =
      new Date(
        event.start_at,
      );

    if (
      Number.isNaN(
        startAt.getTime(),
      ) ||
      startAt.getTime() <=
        Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Actualiza la fecha antes de publicar: el evento debe comenzar en el futuro.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * Exigimos haber pasado por la revisión pre-publicación.
     *
     * No exigimos un porcentaje artificial:
     * Intelligence asesora, no decide por el creador.
     */
    const {
      data: insight,
      error: insightError,
    } =
      await supabaseAdmin
        .from(
          "event_insights",
        )
        .select(
          "event_id",
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
        insightError.message,
      );
    }

    if (!insight) {
      return NextResponse.json(
        {
          error:
            "Analiza el borrador con LookUp Intelligence antes de publicarlo.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      data: publishedEvent,
      error: publishError,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .update({
          status:
            "published",
        })
        .eq(
          "id",
          eventId,
        )
        .eq(
          "creator_profile_id",
          authData.user.id,
        )
        .eq(
          "status",
          "draft",
        )
        .select(
          `
            id,
            status,
            updated_at
          `,
        )
        .single();

    if (
      publishError ||
      !publishedEvent
    ) {
      throw new Error(
        publishError?.message ??
          "No se pudo publicar el evento.",
      );
    }

    return NextResponse.json(
      {
        event: {
          id:
            publishedEvent.id,

          status:
            publishedEvent.status,

          updatedAt:
            publishedEvent.updated_at,
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
      "❌ Error publicando evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo publicar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}
