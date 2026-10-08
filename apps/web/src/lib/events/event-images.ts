export const EVENT_IMAGES_BUCKET = "event-images";

export const EVENT_IMAGES_MAX_COUNT = 5;

export const EVENT_IMAGE_MAX_BYTES = 6 * 1024 * 1024;

export const EVENT_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type EventImageMimeType =
  (typeof EVENT_IMAGE_ALLOWED_MIME_TYPES)[number];

export type EventImageReference = {
  storagePath: string;
  position: number;
};

export type PersistedEventImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  position: number;
};

export function isSupportedEventImageMimeType(
  value: string,
): value is EventImageMimeType {
  return EVENT_IMAGE_ALLOWED_MIME_TYPES.some((mimeType) => mimeType === value);
}

export function getEventImageExtension(mimeType: EventImageMimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";
  }
}

export function isValidEventImageStoragePath(
  storagePath: string,
  profileId: string,
  eventId: string,
) {
  const normalized = storagePath.trim();

  if (!normalized || normalized.includes("..")) {
    return false;
  }

  const prefix = `${profileId}/${eventId}/`;
  return (
    normalized.startsWith(prefix) &&
    /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|mp4|webm|mov|3gp|ogv)$/i.test(
      normalized.slice(prefix.length),
    )
  );
}

export const EVENT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const EVENT_VIDEO_MAX_SECONDS = 59;
export const EVENT_VIDEO_MIME_EXTENSIONS = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/3gpp": "3gp",
  "video/ogg": "ogv",
} as const;
export const EVENT_MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v,video/3gpp,video/ogg,.mov,.m4v,.mp4,.webm,.3gp,.ogv";
export type EventVideoMimeType = keyof typeof EVENT_VIDEO_MIME_EXTENSIONS;
export type EventMediaMimeType = EventImageMimeType | EventVideoMimeType;

export function isSupportedEventMediaMimeType(
  value: string,
): value is EventMediaMimeType {
  return (
    isSupportedEventImageMimeType(value) ||
    Object.hasOwn(EVENT_VIDEO_MIME_EXTENSIONS, value)
  );
}

// iOS and file providers may omit MIME types or use aliases for the same container.
export function getEventMediaMimeType(file: {
  type: string;
  name?: string;
}): string {
  const type = file.type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (type === "video/x-m4v") return "video/mp4";
  if (type === "video/mov" || type === "video/x-quicktime")
    return "video/quicktime";
  if (type && type !== "application/octet-stream") return type;
  const extension = file.name?.split(".").pop()?.toLowerCase();
  const byExtension: Record<string, EventMediaMimeType> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    "3gp": "video/3gpp",
    ogv: "video/ogg",
  };
  return extension ? (byExtension[extension] ?? type) : type;
}

export function isEventVideo(path: string) {
  return /\.(mp4|m4v|webm|mov|3gp|ogv)(?:[?#]|$)/i.test(path);
}

export function getEventMediaExtension(type: EventMediaMimeType) {
  return isSupportedEventImageMimeType(type)
    ? getEventImageExtension(type)
    : EVENT_VIDEO_MIME_EXTENSIONS[type];
}

export function getEventVideoDurationError(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return "No se pudo comprobar la duración del vídeo. Prueba con otro archivo o comparte su enlace externo.";
  if (seconds > EVENT_VIDEO_MAX_SECONDS)
    return "El vídeo supera los 59 segundos. Recórtalo o comparte su enlace externo.";
  return null;
}

export function getEventMediaError(file: {
  type: string;
  size: number;
  name?: string;
}): string | null {
  const type = getEventMediaMimeType(file);
  if (!isSupportedEventMediaMimeType(type))
    return "Admite fotos JPG, PNG o WebP y vídeos MP4, MOV, M4V, WebM, 3GP u OGV. Para otros formatos puedes compartir un enlace externo.";
  if (!Number.isFinite(file.size) || file.size <= 0)
    return "El archivo está vacío o no es válido.";
  const video = type.startsWith("video/");
  if (file.size > (video ? EVENT_VIDEO_MAX_BYTES : EVENT_IMAGE_MAX_BYTES)) {
    return video
      ? "Cada vídeo puede pesar como máximo 50 MB."
      : "Cada foto puede pesar como máximo 6 MB.";
  }
  return null;
}
