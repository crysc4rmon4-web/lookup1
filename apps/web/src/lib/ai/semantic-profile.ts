import "server-only";

import {
  LOOKUP_EMBEDDING_DIMENSIONS,
  LOOKUP_EMBEDDING_MODEL,
} from "./embedding-config";

import {
  createSemanticHash,
  normalizeSemanticList,
  normalizeSemanticValue,
  type SemanticDocument,
} from "./semantic-document";

export const PROFILE_EMBEDDING_MODEL =
  LOOKUP_EMBEDDING_MODEL;

export const PROFILE_EMBEDDING_DIMENSIONS =
  LOOKUP_EMBEDDING_DIMENSIONS;

export type SemanticProfileInput = {
  profession?:
    | string
    | null;

  bio?:
    | string
    | null;

  interests?:
    | readonly string[]
    | null;
};

export type SemanticProfile =
  SemanticDocument;

export function buildSemanticProfile(
  input: SemanticProfileInput,
): SemanticProfile | null {
  const profession =
    normalizeSemanticValue(
      input.profession,
    );

  const bio =
    normalizeSemanticValue(
      input.bio,
    );

  const interests =
    normalizeSemanticList(
      input.interests,
    );

  /*
   * Un perfil sin información semántica útil
   * no debe consumir una llamada a OpenAI.
   */
  if (
    !profession &&
    !bio &&
    interests.length === 0
  ) {
    return null;
  }

  const parts: string[] =
    [];

  if (profession) {
    parts.push(
      `profesion: ${profession}`,
    );
  }

  if (bio) {
    parts.push(
      `biografia: ${bio}`,
    );
  }

  if (
    interests.length >
    0
  ) {
    parts.push(
      `intereses: ${interests.join(
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