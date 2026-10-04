export const EVENT_IMAGES_BUCKET =
  "event-images";

export const EVENT_IMAGES_MAX_COUNT =
  5;

export const EVENT_IMAGE_MAX_BYTES =
  6 * 1024 * 1024;

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
  return EVENT_IMAGE_ALLOWED_MIME_TYPES.some(
    (mimeType) =>
      mimeType === value,
  );
}

export function getEventImageExtension(
  mimeType: EventImageMimeType,
) {
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
  const normalized =
    storagePath.trim();

  if (
    !normalized ||
    normalized.includes("..")
  ) {
    return false;
  }

  const prefix = `${profileId}/${eventId}/`;
  return normalized.startsWith(prefix) && /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(normalized.slice(prefix.length));
}

export const EVENT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const EVENT_MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm";
export type EventMediaMimeType = EventImageMimeType | "video/mp4" | "video/webm";

export function isSupportedEventMediaMimeType(value: string): value is EventMediaMimeType {
  return isSupportedEventImageMimeType(value) || value === "video/mp4" || value === "video/webm";
}

export function isEventVideo(path: string) {
  return /\.(mp4|webm)(?:[?#]|$)/i.test(path);
}

export function getEventMediaExtension(type: EventMediaMimeType) {
  return type === "video/mp4" ? "mp4" : type === "video/webm" ? "webm" : getEventImageExtension(type);
}

export function getEventMediaError(file: { type: string; size: number }): string | null {
  if (!isSupportedEventMediaMimeType(file.type)) return "Admite fotos JPG, PNG o WebP y vídeos MP4 o WebM.";
  if (!Number.isFinite(file.size) || file.size <= 0) return "El archivo está vacío o no es válido.";
  const video = file.type.startsWith("video/");
  if (file.size > (video ? EVENT_VIDEO_MAX_BYTES : EVENT_IMAGE_MAX_BYTES)) {
    return video ? "Cada vídeo puede pesar como máximo 50 MB." : "Cada foto puede pesar como máximo 6 MB.";
  }
  return null;
}
