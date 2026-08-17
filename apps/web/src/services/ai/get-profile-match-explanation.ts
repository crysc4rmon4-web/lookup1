export type ProfileMatchExplanationSource =
  | "ai"
  | "fallback"
  | "unavailable";

export type ProfileMatchExplanationResult = {
  available: boolean;

  matchScore: number | null;

  semanticSimilarity:
    number | null;

  interestSimilarity:
    number;

  sharedInterests:
    string[];

  explanation:
    string | null;

  source:
    ProfileMatchExplanationSource;

  model?: string | null;
};

type ProfileMatchExplanationError = {
  error?: string;
};

export async function getProfileMatchExplanation(
  accessToken: string,
  targetProfileId: string,
): Promise<ProfileMatchExplanationResult> {
  const token =
    accessToken.trim();

  const profileId =
    targetProfileId.trim();

  if (!token) {
    throw new Error(
      "No existe una sesión válida para explicar esta conexión.",
    );
  }

  if (!profileId) {
    throw new Error(
      "El perfil solicitado no es válido.",
    );
  }

  const response =
    await fetch(
      "/api/ai/profile-match/explain",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            targetProfileId:
              profileId,
          }),

        cache:
          "no-store",
      },
    );

  let payload:
    | ProfileMatchExplanationResult
    | ProfileMatchExplanationError
    | null =
    null;

  try {
    payload =
      (await response.json()) as
        | ProfileMatchExplanationResult
        | ProfileMatchExplanationError;
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
        : "No se pudo explicar esta conexión.";

    throw new Error(
      message,
    );
  }

  if (
    !payload ||
    !(
      "available" in
      payload
    )
  ) {
    throw new Error(
      "La respuesta de LookUp Match no es válida.",
    );
  }

  return payload;
}