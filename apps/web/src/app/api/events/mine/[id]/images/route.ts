import {
  NextResponse,
} from "next/server";

import {
  EVENT_IMAGES_BUCKET,
  EVENT_IMAGES_MAX_COUNT,
  isValidEventImageStoragePath,
} from "@/lib/events/event-images";

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

type ImageInput = {
  storagePath:
  string;

  position:
  number;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
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

  return (
    authorization
      .slice(7)
      .trim() ||
    null
  );
}

function isUuid(
  value:
    string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseImages(
  value:
    unknown,
): ImageInput[] {
  if (
    typeof value !==
    "object" ||
    value ===
    null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "Los datos de imágenes no son válidos.",
    );
  }

  const images =
    (
      value as Record<
        string,
        unknown
      >
    ).images;

  if (
    !Array.isArray(
      images,
    ) ||
    images.length >
    EVENT_IMAGES_MAX_COUNT
  ) {
    throw new Error(
      `Puedes guardar hasta ${EVENT_IMAGES_MAX_COUNT} imágenes.`,
    );
  }

  return images.map(
    (
      image,
      index,
    ) => {
      if (
        typeof image !==
        "object" ||
        image ===
        null ||
        Array.isArray(
          image,
        )
      ) {
        throw new Error(
          "Una de las imágenes no es válida.",
        );
      }

      const record =
        image as Record<
          string,
          unknown
        >;

      const storagePath =
        typeof record.storagePath ===
          "string"
          ? record.storagePath.trim()
          : "";

      const position =
        record.position;

      if (
        !storagePath ||
        typeof position !==
        "number" ||
        !Number.isInteger(
          position,
        ) ||
        position !==
        index
      ) {
        throw new Error(
          "El orden de las imágenes no es válido.",
        );
      }

      return {
        storagePath,
        position,
      };
    },
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
            cover_image_url
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

    const {
      data: imageRows,
      error: imageRowsError,
    } =
      await supabaseAdmin
        .from(
          "event_images",
        )
        .select(
          `
            id,
            storage_path,
            position
          `,
        )
        .eq(
          "event_id",
          eventId,
        )
        .order(
          "position",
          {
            ascending:
              true,
          },
        );

    if (imageRowsError) {
      throw new Error(
        `No se pudo cargar la galería: ${imageRowsError.message}`,
      );
    }

    const images =
      (imageRows ?? [])
        .map(
          (image) => {
            const {
              data:
              publicUrlData,
            } =
              supabaseAdmin.storage
                .from(
                  EVENT_IMAGES_BUCKET,
                )
                .getPublicUrl(
                  image.storage_path,
                );

            return {
              id:
                image.id,

              storagePath:
                image.storage_path,

              publicUrl:
                publicUrlData.publicUrl,

              position:
                image.position,
            };
          },
        );

    return NextResponse.json(
      {
        images,

        coverImageUrl:
          event.cover_image_url ??
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
      "❌ Error cargando imágenes del evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar las imágenes del evento.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}

export async function PUT(
  request:
    Request,
  context:
    RouteContext,
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
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Los datos de imágenes no son válidos.",
        },
        {
          status:
            400,

          headers:
            noStoreHeaders(),
        },
      );
    }

    let images:
      ImageInput[];

    try {
      images =
        parseImages(
          body,
        );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof
              Error
              ? error.message
              : "Las imágenes no son válidas.",
        },
        {
          status:
            400,

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
          status:
            401,

          headers:
            noStoreHeaders(),
        },
      );
    }

    const userId =
      authData.user.id;

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
          userId,
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
          status:
            404,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      eventData.status !==
      "draft" &&
      eventData.status !==
      "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Este evento ya no admite cambios de imágenes.",
        },
        {
          status:
            409,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      eventData.status ===
      "published" &&
      new Date(
        eventData.start_at,
      ).getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Un evento que ya comenzó no puede cambiar sus imágenes.",
        },
        {
          status:
            409,

          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      eventData.status ===
      "published" &&
      images.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Un evento publicado debe conservar al menos una imagen.",
        },
        {
          status:
            409,

          headers:
            noStoreHeaders(),
        },
      );
    }

    for (
      const image
      of images
    ) {
      if (
        !isValidEventImageStoragePath(
          image.storagePath,
          userId,
          eventId,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Una de las imágenes no pertenece a este evento.",
          },
          {
            status:
              400,

            headers:
              noStoreHeaders(),
          },
        );
      }
    }

    /*
     * Comprobamos que los objetos realmente
     * existen en Storage antes de persistirlos.
     */
    if (
      images.length >
      0
    ) {
      const folder =
        `${userId}/${eventId}`;

      const {
        data:
        storedObjects,

        error:
        storageError,
      } =
        await supabaseAdmin.storage
          .from(
            EVENT_IMAGES_BUCKET,
          )
          .list(
            folder,
            {
              limit:
                100,
            },
          );

      if (storageError) {
        throw new Error(
          `No se pudieron comprobar las imágenes: ${storageError.message}`,
        );
      }

      const storedNames =
        new Set(
          (
            storedObjects ??
            []
          ).map(
            (object) =>
              object.name,
          ),
        );

      for (
        const image
        of images
      ) {
        const fileName =
          image.storagePath
            .split("/")
            .pop();

        if (
          !fileName ||
          !storedNames.has(
            fileName,
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Una de las imágenes todavía no está disponible en Storage.",
            },
            {
              status:
                409,

              headers:
                noStoreHeaders(),
            },
          );
        }
      }
    }

    const {
      data:
      previousImages,

      error:
      previousImagesError,
    } =
      await supabaseAdmin
        .from(
          "event_images",
        )
        .select(
          "storage_path",
        )
        .eq(
          "event_id",
          eventId,
        );

    if (
      previousImagesError
    ) {
      throw new Error(
        `No se pudo cargar la galería anterior: ${previousImagesError.message}`,
      );
    }

    const {
      error:
      deleteError,
    } =
      await supabaseAdmin
        .from(
          "event_images",
        )
        .delete()
        .eq(
          "event_id",
          eventId,
        );

    if (deleteError) {
      throw new Error(
        `No se pudo actualizar la galería: ${deleteError.message}`,
      );
    }

    let persistedImages:
      {
        id:
        string;

        storage_path:
        string;

        position:
        number;
      }[] =
      [];

    if (
      images.length >
      0
    ) {
      const {
        data:
        insertedData,

        error:
        insertError,
      } =
        await supabaseAdmin
          .from(
            "event_images",
          )
          .insert(
            images.map(
              (image) => ({
                event_id:
                  eventId,

                storage_path:
                  image.storagePath,

                position:
                  image.position,
              }),
            ),
          )
          .select(
            `
              id,
              storage_path,
              position
            `,
          );

      if (
        insertError
      ) {
        throw new Error(
          `No se pudo guardar la galería: ${insertError.message}`,
        );
      }

      persistedImages =
        insertedData ??
        [];
    }

    const publicImages =
      persistedImages
        .sort(
          (
            first,
            second,
          ) =>
            first.position -
            second.position,
        )
        .map(
          (image) => {
            const {
              data: {
                publicUrl,
              },
            } =
              supabaseAdmin.storage
                .from(
                  EVENT_IMAGES_BUCKET,
                )
                .getPublicUrl(
                  image.storage_path,
                );

            return {
              id:
                image.id,

              storagePath:
                image.storage_path,

              publicUrl,

              position:
                image.position,
            };
          },
        );

    const coverImageUrl =
      publicImages[0]
        ?.publicUrl ??
      null;

    const {
      error:
      coverUpdateError,
    } =
      await supabaseAdmin
        .from(
          "events",
        )
        .update({
          cover_image_url:
            coverImageUrl,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          eventId,
        )
        .eq(
          "creator_profile_id",
          userId,
        );

    if (
      coverUpdateError
    ) {
      throw new Error(
        `La galería se guardó pero no pudo actualizarse la portada: ${coverUpdateError.message}`,
      );
    }

    /*
     * Después de persistir correctamente,
     * limpiamos objetos antiguos que ya no
     * forman parte de la galería.
     */
    const nextPaths =
      new Set(
        images.map(
          (image) =>
            image.storagePath,
        ),
      );

    const obsoletePaths =
      (
        previousImages ??
        []
      )
        .map(
          (image) =>
            image.storage_path,
        )
        .filter(
          (storagePath) =>
            !nextPaths.has(
              storagePath,
            ),
        );

    if (
      obsoletePaths.length >
      0
    ) {
      const {
        error:
        removeError,
      } =
        await supabaseAdmin.storage
          .from(
            EVENT_IMAGES_BUCKET,
          )
          .remove(
            obsoletePaths,
          );

      if (removeError) {
        console.error(
          "⚠️ La galería se actualizó pero quedaron objetos antiguos en Storage:",
          removeError,
        );
      }
    }

    return NextResponse.json(
      {
        images:
          publicImages,

        coverImageUrl,
      },
      {
        status:
          200,

        headers:
          noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "❌ Error actualizando imágenes del evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron guardar las imágenes del evento.",
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