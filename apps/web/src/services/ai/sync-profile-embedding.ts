import {
  supabase,
} from "@lookup/services";

export type ProfileEmbeddingSyncStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "deleted"
  | "empty";

export type ProfileEmbeddingSyncResult = {
  status: ProfileEmbeddingSyncStatus;
  model: string | null;
  dimensions: number | null;
};

type ProfileEmbeddingSyncError = {
  error?: string;
};

async function resolveAccessToken(
  providedAccessToken?: string,
) {
  const provided =
    providedAccessToken?.trim();

  if (provided) {
    return provided;
  }

  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const accessToken =
    data.session?.access_token?.trim();

  if (!accessToken) {
    throw new Error(
      "No existe una sesión válida para sincronizar el perfil semántico.",
    );
  }

  return accessToken;
}

export async function syncCurrentProfileEmbedding(
  accessToken?: string,
): Promise<ProfileEmbeddingSyncResult> {
  const token =
    await resolveAccessToken(
      accessToken,
    );

  const response =
    await fetch(
      "/api/ai/profile-embedding/sync",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      },
    );

  let payload:
    | ProfileEmbeddingSyncResult
    | ProfileEmbeddingSyncError
    | null =
    null;

  try {
    payload =
      (await response.json()) as
        | ProfileEmbeddingSyncResult
        | ProfileEmbeddingSyncError;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      "error" in payload &&
      typeof payload.error ===
        "string"
        ? payload.error
        : "No se pudo sincronizar la inteligencia semántica del perfil.";

    throw new Error(
      message,
    );
  }

  if (
    !payload ||
    !("status" in payload)
  ) {
    throw new Error(
      "La respuesta de sincronización semántica no es válida.",
    );
  }

  return payload;
}