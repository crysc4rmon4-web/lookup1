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
     * 1. AUTENTICACIÓN
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
     * 2. VALIDAR EVENT ID
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
     * 3. CARGAR BORRADOR Y COMPROBAR PROPIEDAD
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
      currentStatus !==
      "draft"
    ) {
      return NextResponse.json(
        {
          error:
            currentStatus ===
            "published"
              ? "Este evento ya está publicado."
              : currentStatus ===
                  "cancelled"
                ? "Un evento cancelado no puede publicarse de nuevo."
                : "Solo los borradores pueden publicarse.",
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
 * 4. VALIDAR GALERÍA
 * ==========================================================
 *
 * Un evento público necesita al menos una imagen.
 * La imagen en position 0 se considera automáticamente
 * la portada del evento.
 */

const {
  count: imageCount,
  error: imageCountError,
} =
  await supabaseAdmin
    .from(
      "event_images",
    )
    .select(
      "id",
      {
        count:
          "exact",
        head:
          true,
      },
    )
    .eq(
      "event_id",
      eventId,
    );

if (imageCountError) {
  throw new Error(
    `No se pudo comprobar la galería del evento: ${imageCountError.message}`,
  );
}

if (
  !imageCount ||
  imageCount <
    1
) {
  return NextResponse.json(
    {
      error:
        "Añade al menos una imagen antes de publicar el evento. La primera imagen será su portada.",
    },
    {
      status:
        409,
      headers:
        noStoreHeaders(),
    },
  );
}

    /*
     * ==========================================================
     * 4. VALIDAR FECHA
     * ==========================================================
     */

    const startAt =
      new Date(
        event.start_at,
      );

    const endAt =
      new Date(
        event.end_at,
      );

    if (
      Number.isNaN(
        startAt.getTime(),
      ) ||
      Number.isNaN(
        endAt.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Las fechas del evento no son válidas. Edítalo antes de publicarlo.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
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

    if (
      endAt.getTime() <=
      startAt.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "La fecha de finalización debe ser posterior al inicio.",
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
     * 5. EXIGIR REVISIÓN PRE-PUBLICACIÓN
     * ==========================================================
     *
     * Intelligence asesora.
     *
     * No imponemos una nota mínima artificial, pero sí exigimos
     * que el creador haya revisado la versión actual del borrador.
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
          `
            event_id,
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
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(1)
        .maybeSingle();

    if (insightError) {
      throw new Error(
        `No se pudo comprobar LookUp Intelligence: ${insightError.message}`,
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

    /*
     * ==========================================================
     * 6. PUBLICAR
     * ==========================================================
     *
     * IMPORTANTE:
     *
     * events.status es nuestra fuente de verdad.
     *
     * No escribimos columnas paralelas como:
     * - published
     * - cancelled
     *
     * porque no forman parte del esquema actual y además pueden
     * provocar estados contradictorios.
     */

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
          "draft",
        )
        .select(
          `
            id,
            status,
            updated_at
          `,
        )
        .maybeSingle();

    if (publishError) {
      throw new Error(
        `No se pudo publicar el evento: ${publishError.message}`,
      );
    }

    /*
     * Protege frente a dos publicaciones concurrentes.
     */

    if (!publishedEvent) {
      return NextResponse.json(
        {
          error:
            "El evento cambió de estado y ya no está disponible para publicarse.",
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