import {
  NextResponse,
} from "next/server";

import {
  getSupabaseAdminClient,
} from "@/lib/supabase-admin";

import {
  syncProfileEmbedding,
} from "@/lib/ai/sync-profile-embedding";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type ProfileSemanticRow = {
  id: string;
  profession: string | null;
  bio: string | null;
  interests: string[];
};

function getBearerToken(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (!authorization) {
    return null;
  }

  const [
    scheme,
    token,
  ] =
    authorization.split(
      " ",
    );

  if (
    scheme?.toLowerCase() !==
      "bearer" ||
    !token?.trim()
  ) {
    return null;
  }

  return token.trim();
}

export async function POST(
  request: Request,
) {
  const accessToken =
    getBearerToken(
      request,
    );

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Sesión no válida.",
      },
      {
        status:
          401,
      },
    );
  }

  try {
    const supabaseAdmin =
      getSupabaseAdminClient();

    /*
     * ============================================================
     * 1. Verificar usuario REAL desde el JWT
     * ============================================================
     *
     * No aceptamos profileId desde browser.
     * No confiamos en ningún userId enviado por el cliente.
     */

    const {
      data:
        userData,

      error:
        userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken,
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Sesión no válida o expirada.",
        },
        {
          status:
            401,
        },
      );
    }

    const userId =
      userData.user.id;

    /*
     * ============================================================
     * 2. Leer fuente semántica directamente desde PostgreSQL
     * ============================================================
     *
     * Tampoco aceptamos profession, bio o interests desde
     * el navegador.
     *
     * La única fuente de verdad es profiles.
     */

    const {
      data:
        profileData,

      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles",
        )
        .select(
          `
            id,
            profession,
            bio,
            interests
          `,
        )
        .eq(
          "id",
          userId,
        )
        .maybeSingle();

    if (
      profileError
    ) {
      throw new Error(
        `No se pudo cargar el perfil para generar su embedding: ${profileError.message}`,
      );
    }

    if (
      !profileData
    ) {
      return NextResponse.json(
        {
          error:
            "No existe un perfil asociado a esta cuenta.",
        },
        {
          status:
            404,
        },
      );
    }

    const profile =
      profileData as
        ProfileSemanticRow;

    /*
     * ============================================================
     * 3. Sincronizar embedding
     * ============================================================
     */

    const result =
      await syncProfileEmbedding({
        profileId:
          profile.id,

        profession:
          profile.profession,

        bio:
          profile.bio,

        interests:
          profile.interests,
      });

    /*
     * No devolvemos semantic_text ni el vector.
     *
     * El navegador solo necesita conocer el estado técnico
     * de la sincronización.
     */

    return NextResponse.json(
      {
        status:
          result.status,

        model:
          result.model,

        dimensions:
          result.dimensions,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    /*
     * Información técnica únicamente en servidor.
     * El navegador recibe un mensaje controlado.
     */

    console.error(
      "❌ Error sincronizando embedding de perfil LookUp",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar la inteligencia semántica del perfil.",
      },
      {
        status:
          500,
      },
    );
  }
}