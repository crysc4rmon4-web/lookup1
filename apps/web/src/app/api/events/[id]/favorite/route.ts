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

type PublicEventState = {
  creator_profile_id:
    string;

  end_at:
    string;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
}

function getBearerToken(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
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

function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveRequestContext(
  request: Request,
  context: RouteContext,
) {
  const accessToken =
    getBearerToken(
      request,
    );

  if (!accessToken) {
    return {
      response:
        NextResponse.json(
          {
            error:
              "No autorizado.",
          },
          {
            status: 401,
            headers:
              noStoreHeaders(),
          },
        ),
    };
  }

  const {
    id,
  } =
    await context.params;

  if (!isUuid(id)) {
    return {
      response:
        NextResponse.json(
          {
            error:
              "El identificador del evento no es válido.",
          },
          {
            status: 400,
            headers:
              noStoreHeaders(),
          },
        ),
    };
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
    return {
      response:
        NextResponse.json(
          {
            error:
              "La sesión no es válida.",
          },
          {
            status: 401,
            headers:
              noStoreHeaders(),
          },
        ),
    };
  }

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
          creator_profile_id,
          end_at
        `,
      )
      .eq(
        "id",
        id,
      )
      .eq(
        "status",
        "published",
      )
      .maybeSingle();

  if (eventError) {
    throw new Error(
      `No se pudo comprobar el evento: ${eventError.message}`,
    );
  }

  if (!eventData) {
    return {
      response:
        NextResponse.json(
          {
            error:
              "El evento no está disponible públicamente.",
          },
          {
            status: 404,
            headers:
              noStoreHeaders(),
          },
        ),
    };
  }

  return {
    supabaseAdmin,

    eventId:
      id,

    profileId:
      authData.user.id,

    event:
      eventData as PublicEventState,
  };
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const result =
      await resolveRequestContext(
        request,
        context,
      );

    if (
      "response" in result
    ) {
      return result.response;
    }

    const isOwner =
      result.event.creator_profile_id ===
      result.profileId;

    const isEnded =
      new Date(
        result.event.end_at,
      ).getTime() <
      Date.now();

    const {
      data,
      error,
    } =
      await result.supabaseAdmin
        .from(
          "event_favorites",
        )
        .select(
          "event_id",
        )
        .eq(
          "event_id",
          result.eventId,
        )
        .eq(
          "profile_id",
          result.profileId,
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo comprobar el favorito: ${error.message}`,
      );
    }

    return NextResponse.json(
      {
        isFavorite:
          Boolean(data),

        canFavorite:
          !isOwner &&
          !isEnded,

        reason:
          isOwner
            ? "own_event"
            : isEnded
              ? "ended"
              : null,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error consultando favorito:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo comprobar el favorito.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const result =
      await resolveRequestContext(
        request,
        context,
      );

    if (
      "response" in result
    ) {
      return result.response;
    }

    if (
      result.event.creator_profile_id ===
      result.profileId
    ) {
      return NextResponse.json(
        {
          error:
            "No necesitas guardar tu propio evento.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const endAt =
      new Date(
        result.event.end_at,
      ).getTime();

    if (
      Number.isFinite(
        endAt,
      ) &&
      endAt <
        Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Este evento ya ha finalizado.",
        },
        {
          status: 409,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const {
      error,
    } =
      await result.supabaseAdmin
        .from(
          "event_favorites",
        )
        .insert({
          event_id:
            result.eventId,

          profile_id:
            result.profileId,
        });

    /*
     * La PK compuesta:
     *
     * (event_id, profile_id)
     *
     * evita favoritos duplicados.
     */
    if (
      error &&
      error.code !==
        "23505"
    ) {
      throw new Error(
        `No se pudo guardar el evento: ${error.message}`,
      );
    }

    return NextResponse.json(
      {
        isFavorite:
          true,

        canFavorite:
          true,

        reason:
          null,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error guardando favorito:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const result =
      await resolveRequestContext(
        request,
        context,
      );

    if (
      "response" in result
    ) {
      return result.response;
    }

    const {
      error,
    } =
      await result.supabaseAdmin
        .from(
          "event_favorites",
        )
        .delete()
        .eq(
          "event_id",
          result.eventId,
        )
        .eq(
          "profile_id",
          result.profileId,
        );

    if (error) {
      throw new Error(
        `No se pudo quitar el favorito: ${error.message}`,
      );
    }

    return NextResponse.json(
      {
        isFavorite:
          false,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error eliminando favorito:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo quitar el evento de Guardados.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}