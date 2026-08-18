import "server-only";

export const LOOKUP_EMBEDDING_MODEL =
  "text-embedding-3-small" as const;

export const LOOKUP_EMBEDDING_DIMENSIONS =
  1536 as const;

export type LookupEmbeddingModel =
  typeof LOOKUP_EMBEDDING_MODEL;