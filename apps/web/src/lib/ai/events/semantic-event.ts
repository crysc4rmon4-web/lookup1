import "server-only";

import {
  LOOKUP_EMBEDDING_DIMENSIONS,
  LOOKUP_EMBEDDING_MODEL,
} from "../embedding-config";

import {
  createSemanticHash,
  normalizeSemanticList,
  normalizeSemanticValue,
  type SemanticDocument,
} from "../semantic-document";

export const EVENT_EMBEDDING_MODEL =
  LOOKUP_EMBEDDING_MODEL;

export const EVENT_EMBEDDING_DIMENSIONS =
  LOOKUP_EMBEDDING_DIMENSIONS;

export type SemanticEventInput = {
  title: string;

  description: string;

  category: string;

  tags:
    | readonly string[]
    | null;

  audience:
    | readonly string[]
    | null;
};

export type SemanticEvent =
  SemanticDocument;

function normalizeCategory(
  category: string,
) {
  const normalized =
    normalizeSemanticValue(
      category,
    );

  return normalized
    .replace(
      /[-_]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

export function buildSemanticEvent(
  input: SemanticEventInput,
): SemanticEvent {
  const title =
    normalizeSemanticValue(
      input.title,
    );

  const description =
    normalizeSemanticValue(
      input.description,
    );

  const category =
    normalizeCategory(
      input.category,
    );

  const tags =
    normalizeSemanticList(
      input.tags,
    );

  const audience =
    normalizeSemanticList(
      input.audience,
    );

  if (
    !title ||
    !description ||
    !category
  ) {
    throw new Error(
      "El evento no contiene suficiente información para construir su representación semántica.",
    );
  }

  const parts: string[] =
    [
      `titulo: ${title}`,

      `descripcion: ${description}`,

      `categoria: ${category}`,
    ];

  if (
    tags.length >
    0
  ) {
    parts.push(
      `etiquetas: ${tags.join(
        ", ",
      )}`,
    );
  }

  if (
    audience.length >
    0
  ) {
    parts.push(
      `publico: ${audience.join(
        ", ",
      )}`,
    );
  }

  const semanticText =
    parts.join("\n");

  return {
    semanticText,

    semanticHash:
      createSemanticHash(
        semanticText,
      ),
  };
}