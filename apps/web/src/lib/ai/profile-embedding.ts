import "server-only";

import {
  generateLookupEmbedding,
} from "./embedding";

import {
  PROFILE_EMBEDDING_DIMENSIONS,
  PROFILE_EMBEDDING_MODEL,
} from "./semantic-profile";

export type GeneratedProfileEmbedding = {
  embedding: number[];
  model: typeof PROFILE_EMBEDDING_MODEL;
  dimensions: number;
};

export async function generateProfileEmbedding(
  semanticText: string,
): Promise<GeneratedProfileEmbedding> {
  const generated =
    await generateLookupEmbedding(
      semanticText,
      "un perfil semántico",
    );

  if (
    generated.dimensions !==
    PROFILE_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Dimensión de embedding inesperada para el perfil. Se esperaban ${PROFILE_EMBEDDING_DIMENSIONS} dimensiones y se recibieron ${generated.dimensions}.`,
    );
  }

  return {
    embedding:
      generated.embedding,

    model:
      PROFILE_EMBEDDING_MODEL,

    dimensions:
      generated.dimensions,
  };
}