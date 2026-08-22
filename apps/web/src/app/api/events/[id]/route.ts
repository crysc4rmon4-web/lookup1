import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

import {
  mapPublicEventRow,
  PUBLIC_EVENT_SELECT,
  type PublicEventRow,
} from "@/lib/events/public-event";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
      id,
    } =
      await context.params;

    if (!isUuid(id)) {
      return NextResponse.json(
        {
          error:
            "El identificador del evento no es válido.",
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

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .select(
          PUBLIC_EVENT_SELECT,
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

    if (error) {
      throw new Error(
        `No se pudo cargar el evento: ${error.message}`,
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Este evento no existe o no está disponible públicamente.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        event:
          mapPublicEventRow(
            data as PublicEventRow,
          ),
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error cargando evento público:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar el evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}