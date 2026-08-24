import "server-only";

import {
  createSemanticHash,
  normalizeSemanticValue,
  type SemanticDocument,
} from "../semantic-document";

export type SemanticDiscoveryIntent =
  SemanticDocument;

export function buildSemanticDiscoveryIntent(
  intentText:
    string | null | undefined,
): SemanticDiscoveryIntent | null {
  const intent =
    normalizeSemanticValue(
      intentText,
    );

  if (
    !intent
  ) {
    return null;
  }

  /*
   * Separamos deliberadamente la intención temporal
   * del documento semántico permanente del perfil.
   *
   * Nunca modificamos profile_embeddings.
   */
  const semanticText =
    `intencion actual de descubrimiento: ${intent}`;

  return {
    semanticText,

    semanticHash:
      createSemanticHash(
        semanticText,
      ),
  };
}