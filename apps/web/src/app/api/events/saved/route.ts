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

type FavoriteRow = {
  event_id:
    string;

  created_at:
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

export async function GET(
  request: Request,
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
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

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
          "event_id, created_at",
        )
        .eq(
          "profile_id",
          authData.user.id,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(
          100,
        );

    if (
      favoriteError
    ) {
      throw new Error(
        `No se pudieron cargar los favoritos: ${favoriteError.message}`,
      );
    }

    const favorites =
      (
        favoriteData ??
        []
      ) as FavoriteRow[];

    if (
      favorites.length ===
      0
    ) {
      return NextResponse.json(
        {
          events: [],
          count: 0,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const eventIds =
      favorites.map(
        (
          favorite,
        ) =>
          favorite.event_id,
      );

    const {
      data:
        eventData,
      error:
        eventError,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .select(
          PUBLIC_EVENT_SELECT,
        )
        .in(
          "id",
          eventIds,
        )
        .eq(
          "status",
          "published",
        );

    if (
      eventError
    ) {
      throw new Error(
        `No se pudieron cargar los eventos guardados: ${eventError.message}`,
      );
    }

    const eventsById =
      new Map(
        (
          eventData ??
          []
        ).map(
          (
            event,
          ) => {
            const mapped =
              mapPublicEventRow(
                event as PublicEventRow,
              );

            return [
              mapped.id,
              mapped,
            ] as const;
          },
        ),
      );

    const events =
      favorites.flatMap(
        (
          favorite,
        ) => {
          const event =
            eventsById.get(
              favorite.event_id,
            );

          if (!event) {
            return [];
          }

          return [
            {
              ...event,

              savedAt:
                favorite.created_at,

              isFavorite:
                true,

              canFavorite:
                event.creatorProfileId !==
                  authData.user.id &&
                event.lifecycleStatus !==
                  "ended",
            },
          ];
        },
      );

    return NextResponse.json(
      {
        events,

        count:
          events.length,
      },
      {
        status: 200,
        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error cargando Guardados:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar tus eventos guardados.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}