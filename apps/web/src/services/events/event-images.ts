import {
  supabase,
} from "@lookup/services";

import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGES_BUCKET,
  EVENT_IMAGES_MAX_COUNT,
  getEventImageExtension,
  isSupportedEventImageMimeType,
  type EventImageReference,
  type PersistedEventImage,
} from "@/lib/events/event-images";

type UploadEventImagesInput = {
  creatorProfileId: string;
  eventId: string;
  files: readonly File[];
};

type ReplaceEventImagesInput = {
  accessToken: string;
  eventId: string;
  images: readonly EventImageReference[];
};

type ReplaceEventImagesResponse = {
  images?: PersistedEventImage[];
  coverImageUrl?: string | null;
  error?: string;
};

function validateImageFiles(
  files: readonly File[],
) {
  if (
    files.length >
    EVENT_IMAGES_MAX_COUNT
  ) {
    throw new Error(
      `Puedes añadir como máximo ${EVENT_IMAGES_MAX_COUNT} imágenes.`,
    );
  }

  for (
    const file
    of files
  ) {
    if (
      !isSupportedEventImageMimeType(
        file.type,
      )
    ) {
      throw new Error(
        "Las imágenes deben ser JPG, PNG o WebP.",
      );
    }

    if (
      file.size >
      EVENT_IMAGE_MAX_BYTES
    ) {
      throw new Error(
        "Cada imagen puede pesar como máximo 6 MB.",
      );
    }

    if (
      file.size <=
      0
    ) {
      throw new Error(
        "Una de las imágenes seleccionadas está vacía.",
      );
    }
  }
}

export async function removeEventImagesFromStorage(
  storagePaths:
    readonly string[],
) {
  if (
    storagePaths.length ===
    0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(
        EVENT_IMAGES_BUCKET,
      )
      .remove([
        ...storagePaths,
      ]);

  if (error) {
    console.error(
      "⚠️ No se pudieron limpiar algunas imágenes del evento:",
      error,
    );
  }
}

export async function uploadEventImages({
  creatorProfileId,
  eventId,
  files,
}: UploadEventImagesInput): Promise<EventImageReference[]> {
  const normalizedProfileId =
    creatorProfileId.trim();

  const normalizedEventId =
    eventId.trim();

  if (
    !normalizedProfileId ||
    !normalizedEventId
  ) {
    throw new Error(
      "No se pudo preparar el destino de las imágenes.",
    );
  }

  validateImageFiles(
    files,
  );

  const uploaded:
    EventImageReference[] =
    [];

  try {
    for (
      let position = 0;
      position <
      files.length;
      position += 1
    ) {
      const file =
        files[position];

      if (!file) {
        continue;
      }

      if (
        !isSupportedEventImageMimeType(
          file.type,
        )
      ) {
        throw new Error(
          "Formato de imagen no compatible.",
        );
      }

      const extension =
        getEventImageExtension(
          file.type,
        );

      const storagePath =
        `${normalizedProfileId}/${normalizedEventId}/${crypto.randomUUID()}.${extension}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            EVENT_IMAGES_BUCKET,
          )
          .upload(
            storagePath,
            file,
            {
              cacheControl:
                "31536000",

              upsert:
                false,

              contentType:
                file.type,
            },
          );

      if (error) {
        throw new Error(
          `No se pudo subir una de las imágenes: ${error.message}`,
        );
      }

      uploaded.push({
        storagePath,
        position,
      });
    }

    return uploaded;
  } catch (error) {
    await removeEventImagesFromStorage(
      uploaded.map(
        (image) =>
          image.storagePath,
      ),
    );

    throw error;
  }
}

export async function replaceEventImages({
  accessToken,
  eventId,
  images,
}: ReplaceEventImagesInput) {
  const normalizedToken =
    accessToken.trim();

  if (
    !normalizedToken
  ) {
    throw new Error(
      "No hay una sesión válida.",
    );
  }

  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(eventId)}/images`,
      {
        method:
          "PUT",

        headers: {
          Authorization:
            `Bearer ${normalizedToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            images,
          }),

        cache:
          "no-store",
      },
    );

  const payload =
    (await response
      .json()
      .catch(
        () => ({}),
      )) as ReplaceEventImagesResponse;

  if (
    !response.ok
  ) {
    throw new Error(
      payload.error ||
      "No se pudieron guardar las imágenes del evento.",
    );
  }

  return {
    images:
      Array.isArray(
        payload.images,
      )
        ? payload.images
        : [],

    coverImageUrl:
      payload.coverImageUrl ??
      null,
  };
}