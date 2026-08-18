import "server-only";

import {
  createHash,
} from "node:crypto";

export type SemanticDocument = {
  semanticText: string;
  semanticHash: string;
};

export function normalizeSemanticValue(
  value:
    | string
    | null
    | undefined,
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

export function normalizeSemanticList(
  values:
    | readonly string[]
    | null
    | undefined,
) {
  if (!values?.length) {
    return [];
  }

  const uniqueValues =
    new Set<string>();

  for (const value of values) {
    const normalized =
      normalizeSemanticValue(
        value,
      );

    if (normalized) {
      uniqueValues.add(
        normalized,
      );
    }
  }

  return Array.from(
    uniqueValues,
  ).sort();
}

export function createSemanticHash(
  semanticText: string,
) {
  const normalized =
    semanticText.trim();

  if (!normalized) {
    throw new Error(
      "No se puede generar un hash semántico a partir de texto vacío.",
    );
  }

  return createHash(
    "sha256",
  )
    .update(
      normalized,
      "utf8",
    )
    .digest(
      "hex",
    );
}