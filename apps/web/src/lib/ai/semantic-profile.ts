import "server-only";

import {
  createHash,
} from "node:crypto";

export const PROFILE_EMBEDDING_MODEL =
  "text-embedding-3-small";

export const PROFILE_EMBEDDING_DIMENSIONS =
  1536;

export type SemanticProfileInput = {
  profession?: string | null;
  bio?: string | null;
  interests?: readonly string[] | null;
};

export type SemanticProfile = {
  semanticText: string;
  semanticHash: string;
};

function normalizeSemanticValue(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeInterests(
  interests:
    | readonly string[]
    | null
    | undefined,
) {
  if (!interests?.length) {
    return [];
  }

  const uniqueInterests =
    new Set<string>();

  for (const interest of interests) {
    const normalized =
      normalizeSemanticValue(
        interest,
      );

    if (normalized) {
      uniqueInterests.add(
        normalized,
      );
    }
  }

  return Array.from(
    uniqueInterests,
  ).sort();
}

function createSemanticHash(
  semanticText: string,
) {
  return createHash(
    "sha256",
  )
    .update(
      semanticText,
      "utf8",
    )
    .digest(
      "hex",
    );
}

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
    normalizeInterests(
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
    interests.length > 0
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