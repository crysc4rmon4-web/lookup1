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

  return normalized.startsWith(
    `${profileId}/${eventId}/`,
  );
}