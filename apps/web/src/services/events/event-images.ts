import {
  supabase,
} from "@lookup/services";

import {
  getEventMediaError,
  EVENT_IMAGES_BUCKET,
  EVENT_IMAGES_MAX_COUNT,
  getEventMediaExtension,
  isSupportedEventMediaMimeType,
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

type GetEventImagesResponse = {
  images?:
  PersistedEventImage[];

  coverImageUrl?:
  string | null;

  error?:
  string;
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
      `Puedes añadir como máximo ${EVENT_IMAGES_MAX_COUNT} archivos.`,
    );
  }

  for (const file of files) {
    const error = getEventMediaError(file);
    if (error) throw new Error(error);
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

  // A lost HTTP response can hide a successful gallery save. Never delete
  // objects that the database already references, or guess when it is offline.
  const { data: referenced, error: referenceError } = await supabase
    .from("event_images").select("storage_path").in("storage_path", [...storagePaths]);
  if (referenceError) return;
  const keptPaths = new Set((referenced ?? []).map(image => image.storage_path));
  const removablePaths = storagePaths.filter(path => !keptPaths.has(path));
  if (!removablePaths.length) return;

  const {
    error,
  } =
    await supabase.storage
      .from(
        EVENT_IMAGES_BUCKET,
      )
      .remove([
        ...removablePaths,
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
      "No se pudo preparar el destino de los archivos.",
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
        !isSupportedEventMediaMimeType(
          file.type,
        )
      ) {
        throw new Error(
          "Formato de archivo no compatible.",
        );
      }

      const extension =
        getEventMediaExtension(
          file.type,
        );

      const storagePath =
        `${normalizedProfileId}/${normalizedEventId}/${crypto.randomUUID()}.${extension}`;

      if (file.type.startsWith("video/")) {
        const { uploadEventVideo } = await import("./upload-event-video");
        await uploadEventVideo(storagePath, file);
      } else {
        const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).upload(storagePath, file, {
          cacheControl: "31536000", upsert: false, contentType: file.type,
        });
        if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
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

export async function getEventImages(
  accessToken: string,
  eventId: string,
) {
  const normalizedToken =
    accessToken.trim();

  const normalizedEventId =
    eventId.trim();

  if (
    !normalizedToken
  ) {
    throw new Error(
      "No hay una sesión válida.",
    );
  }

  if (
    !normalizedEventId
  ) {
    throw new Error(
      "El evento solicitado no es válido.",
    );
  }

  const response =
    await fetch(
      `/api/events/mine/${encodeURIComponent(
        normalizedEventId,
      )}/images`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${normalizedToken}`,
        },

        cache:
          "no-store",
      },
    );

  const payload =
    (await response
      .json()
      .catch(
        () => ({}),
      )) as GetEventImagesResponse;

  if (
    !response.ok
  ) {
    throw new Error(
      payload.error ||
      "No se pudieron cargar las imágenes del evento.",
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
