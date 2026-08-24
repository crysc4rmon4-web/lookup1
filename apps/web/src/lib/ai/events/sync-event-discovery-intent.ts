import "server-only";

import {
  getSupabaseAdminClient,
} from "../../supabase-admin";

import {
  generateLookupEmbedding,
  normalizeStoredLookupEmbedding,
  serializeLookupEmbedding,
} from "../embedding";

import {
  LOOKUP_EMBEDDING_DIMENSIONS,
  LOOKUP_EMBEDDING_MODEL,
} from "../embedding-config";

import {
  createEventDiscoveryIntentExpiresAt,
  isEventDiscoveryIntentExpired,
  normalizeEventDiscoveryIntentText,
} from "../../events/event-discovery-preferences";

import {
  buildSemanticDiscoveryIntent,
} from "./semantic-discovery-intent";

export type SyncEventDiscoveryIntentStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "pending"
  | "cleared"
  | "empty"
  | "expired";

export type SyncEventDiscoveryIntentInput = {
  profileId:
    string;

  intentText:
    string | null | undefined;

  refreshExpiry?:
    boolean;
};

export type SyncEventDiscoveryIntentResult = {
  status:
    SyncEventDiscoveryIntentStatus;

  intentText:
    string | null;

  semanticHash:
    string | null;

  expiresAt:
    string | null;

  model:
    string | null;

  dimensions:
    number | null;

  /*
   * Exclusivamente server-side.
   */
  embeddingText:
    string | null;
};

type ExistingDiscoveryIntentRow = {
  intent_text:
    string | null;

  intent_hash:
    string | null;

  intent_embedding:
    unknown;

  intent_model:
    string | null;

  intent_dimensions:
    number | null;

  intent_expires_at:
    string | null;
};

function validateProfileId(
  profileId: string,
) {
  const normalized =
    profileId.trim();

  if (
    !normalized
  ) {
    throw new Error(
      "No se puede sincronizar una intención sin profileId.",
    );
  }

  return normalized;
}

function hasStoredIntentState(
  row:
    ExistingDiscoveryIntentRow,
) {
  return (
    row.intent_text !==
      null ||
    row.intent_hash !==
      null ||
    row.intent_embedding !==
      null ||
    row.intent_model !==
      null ||
    row.intent_dimensions !==
      null ||
    row.intent_expires_at !==
      null
  );
}

export async function syncEventDiscoveryIntent(
  input:
    SyncEventDiscoveryIntentInput,
): Promise<SyncEventDiscoveryIntentResult> {
  const profileId =
    validateProfileId(
      input.profileId,
    );

  const intentText =
    normalizeEventDiscoveryIntentText(
      input.intentText,
    );

  const semanticIntent =
    buildSemanticDiscoveryIntent(
      intentText,
    );

  const refreshExpiry =
    input.refreshExpiry ===
    true;

  const supabaseAdmin =
    getSupabaseAdminClient();

  const {
    data:
      existingData,

    error:
      existingError,
  } =
    await supabaseAdmin
      .from(
        "event_discovery_preferences",
      )
      .select(
        `
          intent_text,
          intent_hash,
          intent_embedding,
          intent_model,
          intent_dimensions,
          intent_expires_at
        `,
      )
      .eq(
        "profile_id",
        profileId,
      )
      .maybeSingle();

  if (
    existingError
  ) {
    throw new Error(
      `No se pudo consultar la intención actual: ${existingError.message}`,
    );
  }

  const existing =
    existingData as
      | ExistingDiscoveryIntentRow
      | null;

  /*
   * ============================================================
   * INTENCIÓN VACÍA
   * ============================================================
   */

  if (
    !semanticIntent
  ) {
    if (
      !existing ||
      !hasStoredIntentState(
        existing,
      )
    ) {
      return {
        status:
          "empty",

        intentText:
          null,

        semanticHash:
          null,

        expiresAt:
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
        clearError,
    } =
      await supabaseAdmin
        .from(
          "event_discovery_preferences",
        )
        .update({
          intent_text:
            null,

          intent_hash:
            null,

          intent_embedding:
            null,

          intent_model:
            null,

          intent_dimensions:
            null,

          intent_expires_at:
            null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "profile_id",
          profileId,
        );

    if (
      clearError
    ) {
      throw new Error(
        `No se pudo limpiar la intención actual: ${clearError.message}`,
      );
    }

    return {
      status:
        "cleared",

      intentText:
        null,

      semanticHash:
        null,

      expiresAt:
        null,

      model:
        null,

      dimensions:
        null,

      embeddingText:
        null,
    };
  }

  const semanticIsSame =
    existing
      ?.intent_hash ===
    semanticIntent.semanticHash;

  /*
   * ============================================================
   * EXPIRACIÓN
   * ============================================================
   */

  if (
    existing &&
    semanticIsSame &&
    isEventDiscoveryIntentExpired(
      existing.intent_expires_at,
    ) &&
    !refreshExpiry
  ) {
    const {
      error:
        expireError,
    } =
      await supabaseAdmin
        .from(
          "event_discovery_preferences",
        )
        .update({
          intent_text:
            null,

          intent_hash:
            null,

          intent_embedding:
            null,

          intent_model:
            null,

          intent_dimensions:
            null,

          intent_expires_at:
            null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "profile_id",
          profileId,
        );

    if (
      expireError
    ) {
      throw new Error(
        `No se pudo retirar la intención caducada: ${expireError.message}`,
      );
    }

    return {
      status:
        "expired",

      intentText:
        null,

      semanticHash:
        null,

      expiresAt:
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
   * CACHE
   * ============================================================
   */

  let existingEmbeddingText:
    string | null =
    null;

  if (
    existing
      ?.intent_embedding !==
      null &&
    existing
      ?.intent_embedding !==
      undefined
  ) {
    try {
      existingEmbeddingText =
        normalizeStoredLookupEmbedding(
          existing.intent_embedding,
        );
    } catch (
      embeddingError
    ) {
      console.error(
        "⚠️ Intent embedding almacenado inválido. Se regenerará.",
        embeddingError,
      );
    }
  }

  const embeddingIsCurrent =
    existing !==
      null &&
    semanticIsSame &&
    existingEmbeddingText !==
      null &&
    existing.intent_model ===
      LOOKUP_EMBEDDING_MODEL &&
    existing.intent_dimensions ===
      LOOKUP_EMBEDDING_DIMENSIONS &&
    !isEventDiscoveryIntentExpired(
      existing.intent_expires_at,
    );

  const shouldRenewExpiry =
    refreshExpiry ||
    !existing ||
    !semanticIsSame ||
    !existing.intent_expires_at;

  const expiresAt =
    shouldRenewExpiry
      ? createEventDiscoveryIntentExpiresAt()
      : existing.intent_expires_at;

  if (
    embeddingIsCurrent &&
    existingEmbeddingText
  ) {
    const shouldUpdateMetadata =
      existing.intent_text !==
        intentText ||
      existing.intent_expires_at !==
        expiresAt;

    if (
      shouldUpdateMetadata
    ) {
      const {
        error:
          metadataError,
      } =
        await supabaseAdmin
          .from(
            "event_discovery_preferences",
          )
          .update({
            intent_text:
              intentText,

            intent_expires_at:
              expiresAt,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "profile_id",
            profileId,
          );

      if (
        metadataError
      ) {
        throw new Error(
          `No se pudo actualizar la intención actual: ${metadataError.message}`,
        );
      }
    }

    return {
      status:
        "unchanged",

      intentText,

      semanticHash:
        semanticIntent.semanticHash,

      expiresAt,

      model:
        LOOKUP_EMBEDDING_MODEL,

      dimensions:
        LOOKUP_EMBEDDING_DIMENSIONS,

      embeddingText:
        existingEmbeddingText,
    };
  }

  /*
   * ============================================================
   * GENERACIÓN
   * ============================================================
   */

  let generated:
    Awaited<
      ReturnType<
        typeof generateLookupEmbedding
      >
    >;

  try {
    generated =
      await generateLookupEmbedding(
        semanticIntent.semanticText,
        "la intención actual de descubrimiento",
      );
  } catch (
    generationError
  ) {
    console.error(
      "⚠️ La intención se guardará sin embedding temporal:",
      generationError,
    );

    const {
      error:
        pendingError,
    } =
      await supabaseAdmin
        .from(
          "event_discovery_preferences",
        )
        .upsert(
          {
            profile_id:
              profileId,

            intent_text:
              intentText,

            intent_hash:
              semanticIntent.semanticHash,

            intent_embedding:
              null,

            intent_model:
              null,

            intent_dimensions:
              null,

            intent_expires_at:
              expiresAt,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "profile_id",
          },
        );

    if (
      pendingError
    ) {
      throw new Error(
        `No se pudo guardar la intención pendiente: ${pendingError.message}`,
      );
    }

    return {
      status:
        "pending",

      intentText,

      semanticHash:
        semanticIntent.semanticHash,

      expiresAt,

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
   * PERSISTENCIA DEL VECTOR VÁLIDO
   * ============================================================
   */

  const {
    error:
      upsertError,
  } =
    await supabaseAdmin
      .from(
        "event_discovery_preferences",
      )
      .upsert(
        {
          profile_id:
            profileId,

          intent_text:
            intentText,

          intent_hash:
            semanticIntent.semanticHash,

          intent_embedding:
            generated.embedding,

          intent_model:
            generated.model,

          intent_dimensions:
            generated.dimensions,

          intent_expires_at:
            expiresAt,

          updated_at:
            new Date()
              .toISOString(),
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
      `No se pudo guardar la intención actual: ${upsertError.message}`,
    );
  }

  return {
    status:
      existing
        ? "updated"
        : "created",

    intentText,

    semanticHash:
      semanticIntent.semanticHash,

    expiresAt,

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