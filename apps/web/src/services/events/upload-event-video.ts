import { DetailedError, Upload } from "tus-js-client";
import { supabase } from "@lookup/services";
import { EVENT_IMAGES_BUCKET } from "@/lib/events/event-images";

// Loaded only when uploading a video. Storage validates the user's token and RLS.
export async function uploadEventVideo(
  storagePath: string,
  file: File,
  contentType: string,
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
        contentType,
        cacheControl: "31536000",
      },
      onError: (error) => {
        const response =
          error instanceof DetailedError ? error.originalResponse : null;
        const status = response?.getStatus();
        const rejectedType =
          status === 415 ||
          /mime.?type|content.?type/i.test(response?.getBody() ?? "");
        const message =
          status === 413
            ? "El vídeo supera el tamaño permitido por el almacenamiento. Prueba una copia más ligera (máximo 50 MB)."
            : rejectedType
              ? "Este formato todavía no está habilitado para subir vídeos. Prueba un MP4 o utiliza el enlace externo."
              : status === 401 || status === 403
                ? "No se ha autorizado la subida. Vuelve a iniciar sesión e inténtalo de nuevo."
                : "No se pudo subir el vídeo. Comprueba tu conexión y vuelve a intentarlo.";
        reject(new Error(message));
      },
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}
