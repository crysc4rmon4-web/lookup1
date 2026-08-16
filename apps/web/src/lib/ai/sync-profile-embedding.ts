import "server-only";

import {
  getSupabaseAdminClient,
} from "../supabase-admin";

import {
  buildSemanticProfile,
  PROFILE_EMBEDDING_DIMENSIONS,
  PROFILE_EMBEDDING_MODEL,
  type SemanticProfileInput,
} from "./semantic-profile";

import {
  generateProfileEmbedding,
} from "./profile-embedding";

export type SyncProfileEmbeddingInput =
  SemanticProfileInput & {
    profileId: string;
  };

export type SyncProfileEmbeddingStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "deleted"
  | "empty";

export type SyncProfileEmbeddingResult = {
  status: SyncProfileEmbeddingStatus;
  semanticHash: string | null;
  model: string | null;
  dimensions: number | null;
};

type ExistingProfileEmbedding = {
  semantic_text: string;
  semantic_hash: string;
  model: string;
  dimensions: number;
};

function validateProfileId(
  profileId: string,
) {
  const value =
    profileId.trim();

  if (!value) {
    throw new Error(
      "No se puede sincronizar un embedding sin profileId.",
    );
  }

  return value;
}

export async function syncProfileEmbedding(
  input: SyncProfileEmbeddingInput,
): Promise<SyncProfileEmbeddingResult> {
  const profileId =
    validateProfileId(
      input.profileId,
    );

  const supabaseAdmin =
    getSupabaseAdminClient();

  /*
   * ============================================================
   * 1. Construir representación semántica
   * ============================================================
   *
   * SyncProfileEmbeddingInput extiende SemanticProfileInput,
   * así que podemos pasar el objeto directamente.
   *
   * Esto además respeta exactOptionalPropertyTypes:
   * una propiedad opcional ausente sigue estando realmente
   * ausente, en lugar de reconstruirla explícitamente con
   * valor undefined.
   */

  const semanticProfile =
    buildSemanticProfile(
      input,
    );

  /*
   * ============================================================
   * 2. Leer embedding actual
   * ============================================================
   */

  const {
    data:
      existingEmbeddingData,

    error:
      existingEmbeddingError,
  } =
    await supabaseAdmin
      .from(
        "profile_embeddings",
      )
      .select(
        `
          semantic_text,
          semantic_hash,
          model,
          dimensions
        `,
      )
      .eq(
        "profile_id",
        profileId,
      )
      .maybeSingle();

  if (
    existingEmbeddingError
  ) {
    throw new Error(
      `No se pudo consultar el embedding actual del perfil: ${existingEmbeddingError.message}`,
    );
  }

  const existingEmbedding =
    existingEmbeddingData as
      | ExistingProfileEmbedding
      | null;

  /*
   * ============================================================
   * 3. Perfil sin información semántica
   * ============================================================
   *
   * Si anteriormente tenía embedding pero el usuario elimina
   * profesión, bio e intereses, debemos eliminar el vector.
   *
   * Dejarlo sería peligroso porque LookUp seguiría haciendo
   * matching con información que ya no representa al usuario.
   */

  if (!semanticProfile) {
    if (
      !existingEmbedding
    ) {
      return {
        status:
          "empty",

        semanticHash:
          null,

        model:
          null,

        dimensions:
          null,
      };
    }

    const {
      error:
        deleteError,
    } =
      await supabaseAdmin
        .from(
          "profile_embeddings",
        )
        .delete()
        .eq(
          "profile_id",
          profileId,
        );

    if (deleteError) {
      throw new Error(
        `No se pudo eliminar el embedding obsoleto del perfil: ${deleteError.message}`,
      );
    }

    return {
      status:
        "deleted",

      semanticHash:
        null,

      model:
        null,

      dimensions:
        null,
    };
  }

  /*
   * ============================================================
   * 4. Cache hit
   * ============================================================
   *
   * No llamamos a OpenAI cuando:
   *
   * - el hash semántico es idéntico
   * - el texto normalizado es idéntico
   * - seguimos usando el mismo modelo
   * - las dimensiones siguen siendo compatibles
   */

  const embeddingIsCurrent =
    existingEmbedding !==
      null &&
    existingEmbedding.semantic_hash ===
      semanticProfile.semanticHash &&
    existingEmbedding.semantic_text ===
      semanticProfile.semanticText &&
    existingEmbedding.model ===
      PROFILE_EMBEDDING_MODEL &&
    existingEmbedding.dimensions ===
      PROFILE_EMBEDDING_DIMENSIONS;

  if (
    embeddingIsCurrent
  ) {
    return {
      status:
        "unchanged",

      semanticHash:
        semanticProfile.semanticHash,

      model:
        PROFILE_EMBEDDING_MODEL,

      dimensions:
        PROFILE_EMBEDDING_DIMENSIONS,
    };
  }

  /*
   * ============================================================
   * 5. Generar embedding
   * ============================================================
   *
   * OpenAI solo se llama después de comprobar la cache.
   *
   * Además, no modificamos la fila actual hasta obtener un
   * embedding válido. Si OpenAI falla, el vector anterior queda
   * intacto y podemos volver a intentarlo posteriormente.
   */

  const generated =
    await generateProfileEmbedding(
      semanticProfile.semanticText,
    );

  /*
   * ============================================================
   * 6. Persistir
   * ============================================================
   */

  const {
    error:
      upsertError,
  } =
    await supabaseAdmin
      .from(
        "profile_embeddings",
      )
      .upsert(
        {
          profile_id:
            profileId,

          semantic_text:
            semanticProfile.semanticText,

          semantic_hash:
            semanticProfile.semanticHash,

          embedding:
            generated.embedding,

          model:
            generated.model,

          dimensions:
            generated.dimensions,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "profile_id",
        },
      );

  if (upsertError) {
    throw new Error(
      `No se pudo guardar el embedding del perfil: ${upsertError.message}`,
    );
  }

  return {
    status:
      existingEmbedding
        ? "updated"
        : "created",

    semanticHash:
      semanticProfile.semanticHash,

    model:
      generated.model,

    dimensions:
      generated.dimensions,
  };
}