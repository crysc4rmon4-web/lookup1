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
     * 3. EVENTO REAL + PROPIEDAD
     * ==========================================================
     */

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
            start_at,
            end_at
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
        `No se pudo comprobar el evento: ${eventError.message}`,
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

    const currentStatus =
      String(
        event.status ??
          "",
      )
        .trim()
        .toLowerCase();

    if (
      currentStatus ===
      "cancelled"
    ) {
      return NextResponse.json(
        {
          error:
            "Este evento ya está cancelado.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      currentStatus ===
      "draft"
    ) {
      return NextResponse.json(
        {
          error:
            "Un borrador no se cancela. Puedes editarlo o eliminarlo.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      currentStatus !==
      "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Este evento ya no puede cancelarse.",
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
     * 4. NO CANCELAR EVENTOS YA FINALIZADOS
     * ==========================================================
     */

    const endAt =
      new Date(
        event.end_at,
      );

    if (
      Number.isNaN(
        endAt.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La fecha del evento no es válida.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      endAt.getTime() <
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Un evento que ya finalizó no puede cancelarse.",
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
     * 5. CANCELAR
     * ==========================================================
     *
     * De nuevo:
     *
     * status es la fuente de verdad.
     */

    const {
      data: cancelledEvent,
      error: cancelError,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .update({
          status:
            "cancelled",

          updated_at:
            new Date().toISOString(),
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
          "published",
        )
        .select(
          `
            id,
            status,
            updated_at
          `,
        )
        .maybeSingle();

    if (cancelError) {
      throw new Error(
        `No se pudo cancelar el evento: ${cancelError.message}`,
      );
    }

    if (!cancelledEvent) {
      return NextResponse.json(
        {
          error:
            "El evento cambió de estado y ya no puede cancelarse.",
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

        event: {
          id:
            cancelledEvent.id,

          status:
            cancelledEvent.status,

          updatedAt:
            cancelledEvent.updated_at,
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
      "❌ Error cancelando evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cancelar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}