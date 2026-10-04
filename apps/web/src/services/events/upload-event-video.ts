import { Upload } from "tus-js-client";
import { supabase } from "@lookup/services";
import { EVENT_IMAGES_BUCKET } from "@/lib/events/event-images";

// Loaded only when uploading a video. Storage validates the user's token and RLS.
export async function uploadEventVideo(
  storagePath: string,
  file: File,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Inicia sesión para subir el vídeo.");
  const endpoint = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  if (endpoint.hostname.endsWith(".supabase.co"))
    endpoint.hostname = endpoint.hostname.replace(
      ".supabase.co",
      ".storage.supabase.co",
    );
  endpoint.pathname = "/storage/v1/upload/resumable";
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: endpoint.toString(),
      retryDelays: [0, 1000, 3000, 5000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "false",
      },
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: false,
      metadata: {
        bucketName: EVENT_IMAGES_BUCKET,
        objectName: storagePath,
        contentType: file.type,
        cacheControl: "31536000",
      },
      onError: () =>
        reject(
          new Error(
            "No se pudo subir el vídeo. Comprueba tu conexión y vuelve a intentarlo.",
          ),
        ),
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}
