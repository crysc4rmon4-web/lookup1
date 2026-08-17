import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

import {
  buildFallbackProfileMatchExplanation,
  generateProfileMatchExplanation,
  type ProfileMatchExplanationInput,
} from "@/lib/ai/profile-match-explanation";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type MatchContextRow = {
  semantic_similarity:
    number | null;

  interest_similarity:
    number;

  shared_interests:
    string[];

  shared_interest_count:
    number;

  match_score:
    number | null;
};

type MatchProfileAccountType =
  | "person"
  | "business";

type MatchProfileRow = {
  id: string;

  full_name:
    string | null;

  profession:
    string | null;

  bio:
    string | null;

  interests:
    string[] | null;

  visibility:
    boolean;

  onboarding_completed:
    boolean;

  account_type:
    MatchProfileAccountType | null;
};

function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getBearerToken(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  return token || null;
}

function normalizeInterests(
  value: string[] | null,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((interest) =>
      interest.trim(),
    )
    .filter(Boolean);
}

function isSupportedAccountType(
  value:
    MatchProfileAccountType |
    null,
): value is MatchProfileAccountType {
  return (
    value === "person" ||
    value === "business"
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
}

export async function POST(
  request: Request,
) {
  try {
    /*
     * ============================================================
     * 1. AUTENTICACIÓN
     * ============================================================
     */

    const accessToken =
      getBearerToken(
        request,
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const supabaseAdmin =
      getSupabaseAdminClient();

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken,
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * 2. TARGET PROFILE
     * ============================================================
     */

    let requestBody:
      | {
          targetProfileId?: unknown;
        }
      | null =
      null;

    try {
      requestBody =
        (await request.json()) as {
          targetProfileId?: unknown;
        };
    } catch {
      requestBody =
        null;
    }

    const targetProfileId =
      typeof requestBody
        ?.targetProfileId ===
        "string"
        ? requestBody.targetProfileId.trim()
        : "";

    if (
      !targetProfileId ||
      !isUuid(
        targetProfileId,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El perfil solicitado no es válido.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const currentUserId =
      authData.user.id;

    /*
     * No existe un match del usuario
     * consigo mismo.
     */
    if (
      currentUserId ===
      targetProfileId
    ) {
      return NextResponse.json(
        {
          available: false,

          matchScore:
            null,

          semanticSimilarity:
            null,

          interestSimilarity:
            0,

          sharedInterests:
            [],

          explanation:
            null,

          source:
            "unavailable",
        },
        {
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * 3. LEER DATOS REALES
     * ============================================================
     *
     * El navegador no nos proporciona:
     *
     * - profesión
     * - biografía
     * - intereses
     * - score
     *
     * Todos los datos utilizados para explicar la conexión
     * vuelven a obtenerse desde PostgreSQL.
     */

    const [
      currentProfileResult,
      targetProfileResult,
      matchResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .from(
            "profiles",
          )
          .select(
            `
              id,
              full_name,
              profession,
              bio,
              interests,
              visibility,
              onboarding_completed,
              account_type
            `,
          )
          .eq(
            "id",
            currentUserId,
          )
          .maybeSingle(),

        supabaseAdmin
          .from(
            "profiles",
          )
          .select(
            `
              id,
              full_name,
              profession,
              bio,
              interests,
              visibility,
              onboarding_completed,
              account_type
            `,
          )
          .eq(
            "id",
            targetProfileId,
          )
          .eq(
            "visibility",
            true,
          )
          .eq(
            "onboarding_completed",
            true,
          )
          .in(
            "account_type",
            [
              "person",
              "business",
            ],
          )
          .maybeSingle(),

        supabaseAdmin.rpc(
          "get_profile_match_context",
          {
            p_current_user_id:
              currentUserId,

            p_target_profile_id:
              targetProfileId,
          },
        ),
      ]);

    if (
      currentProfileResult.error
    ) {
      throw new Error(
        `No se pudo cargar el perfil actual: ${currentProfileResult.error.message}`,
      );
    }

    if (
      targetProfileResult.error
    ) {
      throw new Error(
        `No se pudo cargar el perfil objetivo: ${targetProfileResult.error.message}`,
      );
    }

    if (
      matchResult.error
    ) {
      throw new Error(
        `No se pudo calcular el contexto del match: ${matchResult.error.message}`,
      );
    }

    const currentProfile =
      currentProfileResult.data as
        | MatchProfileRow
        | null;

    const targetProfile =
      targetProfileResult.data as
        | MatchProfileRow
        | null;

    if (
      !currentProfile ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          error:
            "El perfil solicitado no está disponible.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    if (
      !isSupportedAccountType(
        targetProfile.account_type,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El tipo de perfil solicitado no está disponible.",
        },
        {
          status: 404,
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * 4. MATCH REAL
     * ============================================================
     */

    const matchRows =
      (matchResult.data ??
        []) as MatchContextRow[];

    const match =
      matchRows[0] ??
      null;

    /*
     * Si alguno de los perfiles todavía no tiene embedding,
     * la conexión no está disponible.
     */
    if (
      !match ||
      typeof match.match_score !==
        "number"
    ) {
      return NextResponse.json(
        {
          available:
            false,

          matchScore:
            null,

          semanticSimilarity:
            match
              ?.semantic_similarity ??
            null,

          interestSimilarity:
            match
              ?.interest_similarity ??
            0,

          sharedInterests:
            match
              ?.shared_interests ??
            [],

          explanation:
            null,

          source:
            "unavailable",
        },
        {
          headers:
            noStoreHeaders(),
        },
      );
    }

    /*
     * ============================================================
     * 5. CONTEXTO PARA LOOKUP AI
     * ============================================================
     */

    const explanationInput:
      ProfileMatchExplanationInput =
      {
        matchScore:
          match.match_score,

        sharedInterests:
          match.shared_interests ??
          [],

        currentProfile: {
          profession:
            currentProfile.profession,

          bio:
            currentProfile.bio,

          interests:
            normalizeInterests(
              currentProfile.interests,
            ),
        },

        targetProfile: {
          displayName:
            targetProfile.full_name
              ?.trim() ||
            (
              targetProfile.account_type ===
              "business"
                ? "este negocio"
                : "esta persona"
            ),

          /*
           * Esta era la pieza que faltaba.
           *
           * Permite que LookUp AI hable distinto
           * cuando explica una Persona y cuando
           * explica un Business.
           */
          accountType:
            targetProfile.account_type,

          profession:
            targetProfile.profession,

          bio:
            targetProfile.bio,

          interests:
            normalizeInterests(
              targetProfile.interests,
            ),
        },
      };

    /*
     * Siempre construimos primero una explicación determinista.
     *
     * Si OpenAI falla:
     * el usuario sigue obteniendo una explicación útil.
     */
    const fallbackExplanation =
      buildFallbackProfileMatchExplanation(
        explanationInput,
      );

    /*
     * ============================================================
     * 6. EXPLICACIÓN GENERATIVA
     * ============================================================
     */

    try {
      const generated =
        await generateProfileMatchExplanation(
          explanationInput,
        );

      return NextResponse.json(
        {
          available:
            true,

          matchScore:
            match.match_score,

          semanticSimilarity:
            match.semantic_similarity,

          interestSimilarity:
            match.interest_similarity,

          sharedInterests:
            match.shared_interests ??
            [],

          explanation:
            generated.explanation,

          source:
            "ai",

          model:
            generated.model,
        },
        {
          headers:
            noStoreHeaders(),
        },
      );
    } catch (aiError) {
      console.error(
        "❌ No se pudo generar explicación IA del match:",
        aiError,
      );

      /*
       * OpenAI nunca puede romper
       * un match ya calculado.
       */
      return NextResponse.json(
        {
          available:
            true,

          matchScore:
            match.match_score,

          semanticSimilarity:
            match.semantic_similarity,

          interestSimilarity:
            match.interest_similarity,

          sharedInterests:
            match.shared_interests ??
            [],

          explanation:
            fallbackExplanation,

          source:
            "fallback",

          model:
            null,
        },
        {
          headers:
            noStoreHeaders(),
        },
      );
    }
  } catch (error) {
    console.error(
      "❌ Error explicando Profile Match:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo explicar esta conexión.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}