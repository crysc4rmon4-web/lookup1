import { getEventVideoDurationError } from "./event-images";

// An early check for known durations; the API independently validates stored bytes.
export async function validateSelectedEventVideo(file: File): Promise<void> {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  try {
    await new Promise<void>((resolve, reject) => {
      // Unknown codecs and WebM without local duration go to the server parser.
      const timer = window.setTimeout(() => finish(), 8000);
      function finish(error?: Error) {
        window.clearTimeout(timer);
        video.onloadedmetadata = null;
        video.onerror = null;
        if (error) reject(error);
        else resolve();
      }
      video.onloadedmetadata = () => {
        const error =
          Number.isFinite(video.duration) && video.duration > 0
            ? getEventVideoDurationError(video.duration)
            : null;
        finish(error ? new Error(error) : undefined);
      };
      video.onerror = () => finish();
      video.src = url;
    });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
