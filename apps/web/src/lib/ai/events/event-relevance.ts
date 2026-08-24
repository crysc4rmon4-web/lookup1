import "server-only";

import {
  calculateLookupCosineSimilarity,
} from "../embedding";

export type EventRelevanceLevel =
  | "strong"
  | "good"
  | "exploratory"
  | "low";

export type EventRelevanceResult = {
  relevanceScore:
    number;

  semanticSimilarity:
    number;

  level:
    EventRelevanceLevel;
};

export type ExplicitEventInterestInput = {
  profileInterests:
    readonly string[];

  category:
    string;

  tags:
    readonly string[];

  audience:
    readonly string[];
};

export type ContextualEventRelevanceInput = {
  profileRelevanceScore:
    number | null;

  intentRelevanceScore:
    number | null;
};

export type ContextualEventRelevanceResult = {
  relevanceScore:
    number;

  level:
    EventRelevanceLevel;

  profileRelevanceScore:
    number | null;

  intentRelevanceScore:
    number | null;

  intentBoostApplied:
    boolean;
};

/*
 * La intención actual puede potenciar la relevancia,
 * pero nunca sustituye silenciosamente la identidad
 * permanente del usuario.
 *
 * Un 45% significa:
 *
 * - la intención puede influir de forma clara;
 * - nunca puede reducir el score del perfil;
 * - el perfil conserva el peso principal.
 */
const EVENT_DISCOVERY_INTENT_BOOST_FACTOR =
  0.45;

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    Math.max(
      value,
      min,
    ),
    max,
  );
}

function roundSimilarity(
  value: number,
) {
  return (
    Math.round(
      value *
      10_000,
    ) /
    10_000
  );
}

function normalizeScore(
  value:
    number | null,
) {
  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  ) {
    return null;
  }

  return Math.round(
    clamp(
      value,
      0,
      100,
    ),
  );
}

function normalizeSignal(
  value: string,
) {
  return value
    .trim()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[-_]+/g,
      " ",
    )
    .replace(
      /[^a-z0-9\s]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

export function getEventRelevanceLevel(
  relevanceScore:
    number,
): EventRelevanceLevel {
  if (
    relevanceScore >=
    75
  ) {
    return "strong";
  }

  if (
    relevanceScore >=
    55
  ) {
    return "good";
  }

  if (
    relevanceScore >=
    35
  ) {
    return "exploratory";
  }

  return "low";
}

export function calculateEventRelevance(
  profileEmbedding:
    readonly number[],

  eventEmbedding:
    readonly number[],
): EventRelevanceResult {
  const semanticSimilarity =
    calculateLookupCosineSimilarity(
      profileEmbedding,
      eventEmbedding,
    );

  const relevanceScore =
    Math.round(
      clamp(
        semanticSimilarity,
        0,
        1,
      ) *
        100,
    );

  return {
    relevanceScore,

    semanticSimilarity:
      roundSimilarity(
        semanticSimilarity,
      ),

    level:
      getEventRelevanceLevel(
        relevanceScore,
      ),
  };
}

export function calculateContextualEventRelevance({
  profileRelevanceScore,
  intentRelevanceScore,
}: ContextualEventRelevanceInput): ContextualEventRelevanceResult | null {
  const profileScore =
    normalizeScore(
      profileRelevanceScore,
    );

  const intentScore =
    normalizeScore(
      intentRelevanceScore,
    );

  if (
    profileScore ===
      null &&
    intentScore ===
      null
  ) {
    return null;
  }

  /*
   * Perfil insuficiente pero intención explícita.
   *
   * Aquí sí podemos utilizar la intención como contexto
   * principal porque fue escrita deliberadamente
   * por el propio usuario y es temporal.
   */
  if (
    profileScore ===
      null &&
    intentScore !==
      null
  ) {
    return {
      relevanceScore:
        intentScore,

      level:
        getEventRelevanceLevel(
          intentScore,
        ),

      profileRelevanceScore:
        null,

      intentRelevanceScore:
        intentScore,

      intentBoostApplied:
        true,
    };
  }

  if (
    profileScore !==
      null &&
    intentScore ===
      null
  ) {
    return {
      relevanceScore:
        profileScore,

      level:
        getEventRelevanceLevel(
          profileScore,
        ),

      profileRelevanceScore:
        profileScore,

      intentRelevanceScore:
        null,

      intentBoostApplied:
        false,
    };
  }

  if (
    profileScore ===
      null ||
    intentScore ===
      null
  ) {
    return null;
  }

  /*
   * Regla fundamental:
   *
   * la intención NUNCA baja la relevancia del perfil.
   */
  const positiveDifference =
    Math.max(
      0,
      intentScore -
        profileScore,
    );

  const boost =
    Math.round(
      positiveDifference *
        EVENT_DISCOVERY_INTENT_BOOST_FACTOR,
    );

  const relevanceScore =
    clamp(
      profileScore +
        boost,
      0,
      100,
    );

  return {
    relevanceScore,

    level:
      getEventRelevanceLevel(
        relevanceScore,
      ),

    profileRelevanceScore:
      profileScore,

    intentRelevanceScore:
      intentScore,

    intentBoostApplied:
      boost >
      0,
  };
}

export function findExplicitEventInterestMatches({
  profileInterests,
  category,
  tags,
  audience,
}: ExplicitEventInterestInput) {
  const eventSignals =
    new Map<
      string,
      string
    >();

  for (
    const value
    of [
      category,
      ...tags,
      ...audience,
    ]
  ) {
    const normalized =
      normalizeSignal(
        value,
      );

    if (
      normalized &&
      !eventSignals.has(
        normalized,
      )
    ) {
      eventSignals.set(
        normalized,
        value.trim(),
      );
    }
  }

  const matches:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const interest
    of profileInterests
  ) {
    const normalizedInterest =
      normalizeSignal(
        interest,
      );

    if (
      !normalizedInterest ||
      seen.has(
        normalizedInterest,
      ) ||
      !eventSignals.has(
        normalizedInterest,
      )
    ) {
      continue;
    }

    seen.add(
      normalizedInterest,
    );

    matches.push(
      interest.trim(),
    );
  }

  return matches;
}