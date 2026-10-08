import mediaInfoFactory from "mediainfo.js";
import { getEventVideoDurationError } from "./event-images";

// Server-only usage. Inspect actual video tracks, never a duration sent by the client.
export async function getStoredEventVideoError(
  file: Blob,
): Promise<string | null> {
  if (file.size <= 0) return "El archivo no contiene un vídeo válido.";
  const reader = await mediaInfoFactory({
    format: "object",
  });
  try {
    const result = await reader.analyzeData(
      file.size,
      async (size, offset) =>
        new Uint8Array(await file.slice(offset, offset + size).arrayBuffer()),
    );
    const tracks = result.media?.track ?? [];
    const videos = tracks.filter((track) => track["@type"] === "Video");
    if (!videos.length) return "El archivo no contiene un vídeo válido.";
    const durations = tracks
      .filter((track) => ["General", "Video", "Audio"].includes(track["@type"]))
      .map((track) => Number("Duration" in track ? track.Duration : NaN))
      .filter(Number.isFinite);
    return getEventVideoDurationError(
      durations.length ? Math.max(...durations) : NaN,
    );
  } finally {
    reader.close();
  }
}
