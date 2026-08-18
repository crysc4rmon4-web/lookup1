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
  EVENT_EMBEDDING_DIMENSIONS,
  EVENT_EMBEDDING_MODEL,
  buildSemanticEvent,
  type SemanticEventInput,
} from "./semantic-event";

export type SyncEventEmbeddingInput =
  SemanticEventInput & {
    eventId: string;
  };

export type SyncEventEmbeddingStatus =
  | "created"
  | "updated"
  | "unchanged";

export type SyncEventEmbeddingResult = {
  status:
    SyncEventEmbeddingStatus;

  semanticHash:
    string;

  semanticText:
    string;

  model:
    string;

  dimensions:
    number;

  /*
   * Se utiliza server-side para consultas
   * pgvector agregadas.
   *
   * Nunca debe enviarse al navegador.
   */
  embeddingText:
    string;
};

type ExistingEventEmbedding = {
  semantic_text: string;
  semantic_hash: string;
  embedding: unknown;
  model: string;
  dimensions: number;
};

function validateEventId(
  eventId: string,
) {
  const value =
    eventId.trim();

  if (!value) {
    throw new Error(
      "No se puede sincronizar un embedding sin eventId.",
    );
  }

  return value;
}

export async function syncEventEmbedding(
  input: SyncEventEmbeddingInput,
): Promise<SyncEventEmbeddingResult> {
  const eventId =
    validateEventId(
      input.eventId,
    );

  const semanticEvent =
    buildSemanticEvent(
      input,
    );

  const supabaseAdmin =
    getSupabaseAdminClient();

  /*
   * ============================================================
   * 1. LEER CACHE
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
        "event_embeddings",
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
        "event_id",
        eventId,
      )
      .maybeSingle();

  if (
    existingEmbeddingError
  ) {
    throw new Error(
      `No se pudo consultar el embedding actual del evento: ${existingEmbeddingError.message}`,
    );
  }

  const existingEmbedding =
    existingEmbeddingData as
      | ExistingEventEmbedding
      | null;

  /*
   * ============================================================
   * 2. CACHE HIT
   * ============================================================
   */

  const embeddingIsCurrent =
    existingEmbedding !==
      null &&
    existingEmbedding.semantic_hash ===
      semanticEvent.semanticHash &&
    existingEmbedding.semantic_text ===
      semanticEvent.semanticText &&
    existingEmbedding.model ===
      EVENT_EMBEDDING_MODEL &&
    existingEmbedding.dimensions ===
      EVENT_EMBEDDING_DIMENSIONS;

  if (
    embeddingIsCurrent
  ) {
    return {
      status:
        "unchanged",

      semanticHash:
        semanticEvent.semanticHash,

      semanticText:
        semanticEvent.semanticText,

      model:
        EVENT_EMBEDDING_MODEL,

      dimensions:
        EVENT_EMBEDDING_DIMENSIONS,

      embeddingText:
        normalizeStoredLookupEmbedding(
          existingEmbedding.embedding,
        ),
    };
  }

  /*
   * ============================================================
   * 3. OPENAI
   * ============================================================
   *
   * Solo llegamos aquí cuando el contenido semántico
   * cambió o todavía no existe vector.
   */

  const generated =
    await generateLookupEmbedding(
      semanticEvent.semanticText,
      "un evento semántico",
    );

  /*
   * ============================================================
   * 4. PERSISTIR
   * ============================================================
   */

  const {
    error:
      upsertError,
  } =
    await supabaseAdmin
      .from(
        "event_embeddings",
      )
      .upsert(
        {
          event_id:
            eventId,

          semantic_text:
            semanticEvent.semanticText,

          semantic_hash:
            semanticEvent.semanticHash,

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
            "event_id",
        },
      );

  if (upsertError) {
    throw new Error(
      `No se pudo guardar el embedding del evento: ${upsertError.message}`,
    );
  }

  return {
    status:
      existingEmbedding
        ? "updated"
        : "created",

    semanticHash:
      semanticEvent.semanticHash,

    semanticText:
      semanticEvent.semanticText,

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