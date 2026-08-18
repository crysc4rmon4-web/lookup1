import "server-only";

import {
  getOpenAIClient,
} from "../openai";

import {
  LOOKUP_EMBEDDING_DIMENSIONS,
  LOOKUP_EMBEDDING_MODEL,
  type LookupEmbeddingModel,
} from "./embedding-config";

export type GeneratedLookupEmbedding = {
  embedding: number[];
  model: LookupEmbeddingModel;
  dimensions: number;
};

export async function generateLookupEmbedding(
  semanticText: string,
  contextLabel = "contenido semántico",
): Promise<GeneratedLookupEmbedding> {
  const input =
    semanticText.trim();

  if (!input) {
    throw new Error(
      `No se puede generar un embedding a partir de ${contextLabel} vacío.`,
    );
  }

  const openai =
    getOpenAIClient();

  const response =
    await openai.embeddings.create({
      model:
        LOOKUP_EMBEDDING_MODEL,

      input,

      encoding_format:
        "float",
    });

  const embedding =
    response.data[0]?.embedding;

  if (!embedding) {
    throw new Error(
      `OpenAI no devolvió un embedding para ${contextLabel}.`,
    );
  }

  if (
    embedding.length !==
    LOOKUP_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Dimensión de embedding inesperada para ${contextLabel}. Se esperaban ${LOOKUP_EMBEDDING_DIMENSIONS} dimensiones y se recibieron ${embedding.length}.`,
    );
  }

  return {
    embedding,

    model:
      LOOKUP_EMBEDDING_MODEL,

    dimensions:
      embedding.length,
  };
}

export function serializeLookupEmbedding(
  embedding:
    readonly number[],
) {
  if (
    embedding.length !==
    LOOKUP_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `No se puede serializar un embedding de ${embedding.length} dimensiones. Se esperaban ${LOOKUP_EMBEDDING_DIMENSIONS}.`,
    );
  }

  for (const value of embedding) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new Error(
        "El embedding contiene valores no válidos.",
      );
    }
  }

  return `[${embedding.join(
    ",",
  )}]`;
}

export function normalizeStoredLookupEmbedding(
  value: unknown,
) {
  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value.trim();

    if (
      normalized.startsWith(
        "[",
      ) &&
      normalized.endsWith(
        "]",
      )
    ) {
      return normalized;
    }

    throw new Error(
      "El vector almacenado no tiene un formato válido.",
    );
  }

  if (
    Array.isArray(value)
  ) {
    const embedding =
      value.map(
        (item) =>
          Number(item),
      );

    return serializeLookupEmbedding(
      embedding,
    );
  }

  throw new Error(
    "No se pudo interpretar el vector almacenado.",
  );
}