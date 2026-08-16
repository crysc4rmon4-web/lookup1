import "server-only";

import {
  getOpenAIClient,
} from "../openai";

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
  const input =
    semanticText.trim();

  if (!input) {
    throw new Error(
      "No se puede generar un embedding a partir de un perfil semántico vacío.",
    );
  }

  const openai =
    getOpenAIClient();

  const response =
    await openai.embeddings.create({
      model:
        PROFILE_EMBEDDING_MODEL,

      input,

      encoding_format:
        "float",
    });

  const embedding =
    response.data[0]?.embedding;

  if (!embedding) {
    throw new Error(
      "OpenAI no devolvió un embedding para el perfil.",
    );
  }

  if (
    embedding.length !==
    PROFILE_EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Dimensión de embedding inesperada. Se esperaban ${PROFILE_EMBEDDING_DIMENSIONS} dimensiones y se recibieron ${embedding.length}.`,
    );
  }

  return {
    embedding,

    model:
      PROFILE_EMBEDDING_MODEL,

    dimensions:
      embedding.length,
  };
}