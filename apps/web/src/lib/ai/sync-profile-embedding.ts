import "server-only";

import {
  getSupabaseAdminClient,
} from "../supabase-admin";

import {
  normalizeStoredLookupEmbedding,
  serializeLookupEmbedding,
} from "./embedding";

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
  status:
    SyncProfileEmbeddingStatus;

  semanticHash:
    string | null;

  semanticText:
    string | null;

  model:
    string | null;

  dimensions:
    number | null;

  /*
   * Únicamente para lógica server-side.
   *
   * Nunca debe enviarse directamente al navegador.
   */
  embeddingText:
    string | null;
};

type ExistingProfileEmbedding = {
  semantic_text:
    string;

  semantic_hash:
    string;

  embedding:
    unknown;

  model:
    string;

  dimensions:
    number;
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
  input:
    SyncProfileEmbeddingInput,
): Promise<SyncProfileEmbeddingResult> {
  const profileId =
    validateProfileId(
      input.profileId,
    );

  const supabaseAdmin =
    getSupabaseAdminClient();

  /*
   * ============================================================
   * 1. REPRESENTACIÓN SEMÁNTICA ACTUAL
   * ============================================================
   */

  const semanticProfile =
    buildSemanticProfile(
      input,
    );

  /*
   * ============================================================
   * 2. LEER CACHE
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
          embedding,
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
   * 3. PERFIL SIN CONTEXTO SEMÁNTICO
   * ============================================================
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

        semanticText:
          null,

        model:
          null,

        dimensions:
          null,

        embeddingText:
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

    if (
      deleteError
    ) {
      throw new Error(
        `No se pudo eliminar el embedding obsoleto del perfil: ${deleteError.message}`,
      );
    }

    return {
      status:
        "deleted",

      semanticHash:
        null,

      semanticText:
        null,

      model:
        null,

      dimensions:
        null,

      embeddingText:
        null,
    };
  }

  /*
   * ============================================================
   * 4. VALIDAR VECTOR CACHEADO
   * ============================================================
   *
   * No basta con que hash/modelo/dimensiones coincidan.
   *
   * Si el vector estuviera corrupto, debemos regenerarlo
   * en lugar de considerar la cache válida.
   */

  let existingEmbeddingText:
    string | null =
    null;

  if (
    existingEmbedding
  ) {
    try {
      existingEmbeddingText =
        normalizeStoredLookupEmbedding(
          existingEmbedding.embedding,
        );
    } catch (
      embeddingError
    ) {
      console.error(
        "⚠️ Embedding de perfil almacenado inválido. Se regenerará.",
        embeddingError,
      );

      existingEmbeddingText =
        null;
    }
  }

  const embeddingIsCurrent =
    existingEmbedding !==
      null &&
    existingEmbeddingText !==
      null &&
    existingEmbedding.semantic_hash ===
      semanticProfile.semanticHash &&
    existingEmbedding.semantic_text ===
      semanticProfile.semanticText &&
    existingEmbedding.model ===
      PROFILE_EMBEDDING_MODEL &&
    existingEmbedding.dimensions ===
      PROFILE_EMBEDDING_DIMENSIONS;

  /*
   * ============================================================
   * 5. CACHE HIT
   * ============================================================
   */

  if (
    embeddingIsCurrent &&
    existingEmbeddingText
  ) {
    return {
      status:
        "unchanged",

      semanticHash:
        semanticProfile.semanticHash,

      semanticText:
        semanticProfile.semanticText,

      model:
        PROFILE_EMBEDDING_MODEL,

      dimensions:
        PROFILE_EMBEDDING_DIMENSIONS,

      embeddingText:
        existingEmbeddingText,
    };
  }

  /*
   * ============================================================
   * 6. GENERAR EMBEDDING
   * ============================================================
   */

  const generated =
    await generateProfileEmbedding(
      semanticProfile.semanticText,
    );

  /*
   * ============================================================
   * 7. PERSISTIR
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

  if (
    upsertError
  ) {
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

    semanticText:
      semanticProfile.semanticText,

    model:
      generated.model,

    dimensions:
      generated.dimensions,

    embeddingText:
      serializeLookupEmbedding(
        generated.embedding,
      ),
  };
}