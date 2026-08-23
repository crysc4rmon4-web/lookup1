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

function validateLookupEmbedding(
  embedding:
    readonly number[],
  contextLabel:
    string,
) {
  if (
    embedding.length !==
    LOOKUP_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Dimensión de embedding inesperada para ${contextLabel}. Se esperaban ${LOOKUP_EMBEDDING_DIMENSIONS} dimensiones y se recibieron ${embedding.length}.`,
    );
  }

  for (
    const value
    of embedding
  ) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new Error(
        `El embedding de ${contextLabel} contiene valores no válidos.`,
      );
    }
  }
}

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

  validateLookupEmbedding(
    embedding,
    contextLabel,
  );

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
  validateLookupEmbedding(
    embedding,
    "serialización",
  );

  return `[${embedding.join(
    ",",
  )}]`;
}

export function parseStoredLookupEmbedding(
  value: unknown,
) {
  let rawEmbedding:
    unknown;

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value.trim();

    if (
      !normalized.startsWith(
        "[",
      ) ||
      !normalized.endsWith(
        "]",
      )
    ) {
      throw new Error(
        "El vector almacenado no tiene un formato válido.",
      );
    }

    try {
      rawEmbedding =
        JSON.parse(
          normalized,
        );
    } catch {
      throw new Error(
        "El vector almacenado no pudo interpretarse.",
      );
    }
  } else {
    rawEmbedding =
      value;
  }

  if (
    !Array.isArray(
      rawEmbedding,
    )
  ) {
    throw new Error(
      "No se pudo interpretar el vector almacenado.",
    );
  }

  const embedding =
    rawEmbedding.map(
      (
        item,
      ) =>
        Number(
          item,
        ),
    );

  validateLookupEmbedding(
    embedding,
    "vector almacenado",
  );

  return embedding;
}

export function normalizeStoredLookupEmbedding(
  value: unknown,
) {
  return serializeLookupEmbedding(
    parseStoredLookupEmbedding(
      value,
    ),
  );
}

export function calculateLookupCosineSimilarity(
  left:
    readonly number[],
  right:
    readonly number[],
) {
  validateLookupEmbedding(
    left,
    "primer vector",
  );

  validateLookupEmbedding(
    right,
    "segundo vector",
  );

  let dotProduct =
    0;

  let leftMagnitudeSquared =
    0;

  let rightMagnitudeSquared =
    0;

  for (
    let index = 0;
    index <
    LOOKUP_EMBEDDING_DIMENSIONS;
    index += 1
  ) {
    const leftValue =
      left[index];

    const rightValue =
      right[index];

    if (
      leftValue ===
        undefined ||
      rightValue ===
        undefined
    ) {
      throw new Error(
        "No se pudo calcular la similitud porque los vectores están incompletos.",
      );
    }

    dotProduct +=
      leftValue *
      rightValue;

    leftMagnitudeSquared +=
      leftValue *
      leftValue;

    rightMagnitudeSquared +=
      rightValue *
      rightValue;
  }

  const denominator =
    Math.sqrt(
      leftMagnitudeSquared,
    ) *
    Math.sqrt(
      rightMagnitudeSquared,
    );

  if (
    !Number.isFinite(
      denominator,
    ) ||
    denominator ===
      0
  ) {
    throw new Error(
      "No se puede calcular similitud con un vector de magnitud cero.",
    );
  }

  const similarity =
    dotProduct /
    denominator;

  /*
   * Pequeños errores de coma flotante pueden producir
   * valores como 1.0000000002.
   */
  return Math.max(
    -1,
    Math.min(
      1,
      similarity,
    ),
  );
}