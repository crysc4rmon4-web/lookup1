import OpenAI from "openai";

import type {
  EventIntelligenceConfidence,
  EventIntelligenceVerdict,
  EventLocalAudiencePreview,
  EventPrepublishAdvice,
  EventReadinessPublic,
} from "@/lib/events/event-intelligence-types";

export type EventPrepublishIntelligenceInput = {
  event: {
    title: string;

    description: string;

    category: string;

    tags: string[];

    audience: string[];

    city: string;

    startAt: string;

    endAt: string;

    isFree: boolean;

    priceFrom:
      number | null;

    externalUrl:
      string | null;
  };

  readiness:
    EventReadinessPublic;

  localAudience:
    EventLocalAudiencePreview;
};

type GeneratedAdvicePayload = {
  title?: unknown;

  message?: unknown;

  recommendation?: unknown;
};

const DEFAULT_MODEL =
  "gpt-4o-mini";

const MAX_TITLE_LENGTH =
  100;

const MAX_MESSAGE_LENGTH =
  900;

const MAX_RECOMMENDATION_LENGTH =
  900;

let openAIClient:
  OpenAI | null =
  null;

function getOpenAIClient() {
  const apiKey =
    process.env
      .OPENAI_API_KEY
      ?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY no está configurada.",
    );
  }

  if (!openAIClient) {
    openAIClient =
      new OpenAI({
        apiKey,
      });
  }

  return openAIClient;
}

function getModel() {
  return (
    process.env
      .OPENAI_EVENT_INTELLIGENCE_MODEL
      ?.trim() ||
    DEFAULT_MODEL
  );
}

function cleanText(
  value: string,
) {
  return value
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function trimToLength(
  value: string,
  maximum: number,
) {
  const normalized =
    cleanText(
      value,
    );

  if (
    normalized.length <=
    maximum
  ) {
    return normalized;
  }

  return `${normalized
    .slice(
      0,
      maximum - 1,
    )
    .trim()}…`;
}

function joinHumanList(
  values: string[],
) {
  if (
    values.length ===
    0
  ) {
    return "";
  }

  if (
    values.length ===
    1
  ) {
    return values[0];
  }

  if (
    values.length ===
    2
  ) {
    return `${values[0]} y ${values[1]}`;
  }

  return `${values
    .slice(
      0,
      -1,
    )
    .join(", ")} y ${
    values[
      values.length - 1
    ]
  }`;
}

function determineVerdict(
  readiness:
    EventReadinessPublic,
): EventIntelligenceVerdict {
  if (
    readiness.score >=
    85
  ) {
    return "works";
  }

  if (
    readiness.score >=
    55
  ) {
    return "improve";
  }

  return "learning";
}

function determineConfidence(
  localAudience:
    EventLocalAudiencePreview,
): EventIntelligenceConfidence {
  switch (
    localAudience.sampleStatus
  ) {
    case "sufficient":
      return "high";

    case "insufficient_related_sample":
      return "medium";

    case "insufficient_sample":
      return "low";

    case "no_local_data":
    case "unavailable":
    default:
      return "insufficient";
  }
}

function getAdviceTitle(
  readiness:
    EventReadinessPublic,
) {
  if (
    readiness.score >=
    92
  ) {
    return "Muy bien encaminado";
  }

  if (
    readiness.score >=
    78
  ) {
    return "Casi listo para publicar";
  }

  if (
    readiness.score >=
    58
  ) {
    return "Hay una buena base, pero todavía puede ganar claridad";
  }

  return "Conviene reforzar la propuesta antes de publicarla";
}

function buildFailedChecksSummary(
  readiness:
    EventReadinessPublic,
) {
  const failed =
    readiness.checks.filter(
      (check) =>
        !check.passed,
    );

  return failed;
}

function buildFallbackMessage(
  readiness:
    EventReadinessPublic,
) {
  const failed =
    buildFailedChecksSummary(
      readiness,
    );

  if (
    failed.length ===
    0
  ) {
    return (
      "La propuesta está bien construida y los elementos principales permiten entender qué ocurrirá, para quién está pensada y cómo participar. " +
      "No detectamos un problema estructural importante antes de publicarla."
    );
  }

  const labels =
    failed.map(
      (check) =>
        check.label.toLocaleLowerCase(
          "es",
        ),
    );

  if (
    failed.length ===
    1
  ) {
    return (
      `La base del evento está clara, pero todavía merece atención ${labels[0]}. ` +
      "No impide publicarlo, aunque mejorarlo puede hacer que una persona entienda la propuesta con menos esfuerzo y tenga más motivos para interesarse."
    );
  }

  return (
    `El evento tiene una base reconocible, pero todavía hay varios puntos que conviene trabajar en conjunto: ${joinHumanList(
      labels,
    )}. ` +
    "No son problemas aislados: juntos influyen en lo rápido que una persona entiende qué va a vivir, si la experiencia encaja con ella y cuál debería ser su siguiente paso."
  );
}

function buildFallbackRecommendation(
  readiness:
    EventReadinessPublic,
) {
  const failed =
    buildFailedChecksSummary(
      readiness,
    );

  if (
    failed.length ===
    0
  ) {
    return null;
  }

  const actions =
    failed.map(
      (
        check,
        index,
      ) => {
        const message =
          cleanText(
            check.message,
          ).replace(
            /[.!?]+$/,
            "",
          );

        return `${index + 1}) ${check.label}: ${message}.`;
      },
    );

  return (
    `Antes de publicar, prioriza estos ajustes: ${actions.join(
      " ",
    )}`
  );
}

export function buildFallbackEventPrepublishAdvice(
  input:
    EventPrepublishIntelligenceInput,
): EventPrepublishAdvice {
  return {
    verdict:
      determineVerdict(
        input.readiness,
      ),

    confidence:
      determineConfidence(
        input.localAudience,
      ),

    title:
      getAdviceTitle(
        input.readiness,
      ),

    message:
      buildFallbackMessage(
        input.readiness,
      ),

    recommendation:
      buildFallbackRecommendation(
        input.readiness,
      ),

    source:
      "fallback",

    model:
      null,
  };
}

function normalizeComparableText(
  value: string,
) {
  return value
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "es",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim();
}

const COMPARISON_STOP_WORDS =
  new Set([
    "a",
    "al",
    "algo",
    "como",
    "con",
    "de",
    "del",
    "el",
    "en",
    "es",
    "esta",
    "este",
    "esto",
    "hacer",
    "la",
    "las",
    "lo",
    "los",
    "mas",
    "mejor",
    "para",
    "por",
    "que",
    "se",
    "ser",
    "si",
    "su",
    "te",
    "tu",
    "un",
    "una",
    "y",
  ]);

function getMeaningfulWords(
  value: string,
) {
  return new Set(
    normalizeComparableText(
      value,
    )
      .split(
        " ",
      )
      .filter(
        (word) =>
          word.length >
            2 &&
          !COMPARISON_STOP_WORDS.has(
            word,
          ),
      ),
  );
}

function calculateSemanticOverlap(
  left: string,
  right: string,
) {
  const leftWords =
    getMeaningfulWords(
      left,
    );

  const rightWords =
    getMeaningfulWords(
      right,
    );

  if (
    leftWords.size ===
      0 ||
    rightWords.size ===
      0
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const word of
    leftWords
  ) {
    if (
      rightWords.has(
        word,
      )
    ) {
      intersection +=
        1;
    }
  }

  /*
   * Usamos el conjunto más pequeño como divisor.
   *
   * Esto detecta específicamente el caso:
   *
   * mensaje:
   * "Te recomiendo hacer el título más específico..."
   *
   * recomendación:
   * "Haz el título más específico..."
   *
   * aunque una frase sea más larga.
   */

  return (
    intersection /
    Math.min(
      leftWords.size,
      rightWords.size,
    )
  );
}

function areAdviceTextsTooSimilar(
  message: string,
  recommendation: string,
) {
  const normalizedMessage =
    normalizeComparableText(
      message,
    );

  const normalizedRecommendation =
    normalizeComparableText(
      recommendation,
    );

  if (
    !normalizedMessage ||
    !normalizedRecommendation
  ) {
    return false;
  }

  if (
    normalizedMessage.includes(
      normalizedRecommendation,
    ) ||
    normalizedRecommendation.includes(
      normalizedMessage,
    )
  ) {
    return true;
  }

  return (
    calculateSemanticOverlap(
      normalizedMessage,
      normalizedRecommendation,
    ) >= 0.72
  );
}

function getStringProperty(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? cleanText(
        value,
      )
    : "";
}

function getNullableStringProperty(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const normalized =
    cleanText(
      value,
    );

  return normalized ||
    null;
}

function parseGeneratedPayload(
  value: string,
): GeneratedAdvicePayload {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        value,
      );
  } catch {
    throw new Error(
      "La respuesta de Intelligence no contiene JSON válido.",
    );
  }

  if (
    typeof parsed !==
      "object" ||
    parsed === null ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      "La respuesta de Intelligence no tiene el formato esperado.",
    );
  }

  return parsed as GeneratedAdvicePayload;
}

function buildPromptEvidence(
  input:
    EventPrepublishIntelligenceInput,
) {
  const failedChecks =
    input.readiness.checks
      .filter(
        (check) =>
          !check.passed,
      )
      .map(
        (check) => ({
          id:
            check.id,

          label:
            check.label,

          score:
            check.score,

          maxScore:
            check.maxScore,

          message:
            check.message,
        }),
      );

  const passedChecks =
    input.readiness.checks
      .filter(
        (check) =>
          check.passed,
      )
      .map(
        (check) => ({
          id:
            check.id,

          label:
            check.label,

          message:
            check.message,
        }),
      );

  return {
    event: {
      title:
        input.event.title,

      description:
        input.event.description,

      category:
        input.event.category,

      tags:
        input.event.tags,

      audience:
        input.event.audience,

      city:
        input.event.city,

      startAt:
        input.event.startAt,

      endAt:
        input.event.endAt,

      isFree:
        input.event.isFree,

      priceFrom:
        input.event.priceFrom,

      hasExternalAction:
        Boolean(
          input.event
            .externalUrl,
        ),
    },

    readiness: {
      score:
        input.readiness
          .score,

      status:
        input.readiness
          .status,

      failedChecks,

      passedChecks,

      strengths:
        input.readiness
          .strengths,

      improvements:
        input.readiness
          .improvements,
    },

    localAudience: {
      sampleStatus:
        input.localAudience
          .sampleStatus,

      analyzedProfiles:
        input.localAudience
          .analyzedProfiles,

      relatedProfiles:
        input.localAudience
          .relatedProfiles,

      strongProfiles:
        input.localAudience
          .strongProfiles,

      averageSimilarity:
        input.localAudience
          .averageSimilarity,

      topInterests:
        input.localAudience
          .topInterests,
    },
  };
}

export async function generateEventPrepublishAdvice(
  input:
    EventPrepublishIntelligenceInput,
): Promise<EventPrepublishAdvice> {
  const client =
    getOpenAIClient();

  const model =
    getModel();

  const fallback =
    buildFallbackEventPrepublishAdvice(
      input,
    );

  const evidence =
    buildPromptEvidence(
      input,
    );

  const completion =
    await client.chat.completions.create({
      model,

      temperature:
        0.35,

      response_format: {
        type:
          "json_object",
      },

      messages: [
        {
          role:
            "system",

          content: `
Eres LookUp Intelligence, un asesor de producto para creadores de eventos.

Tu trabajo NO es elogiar automáticamente al creador ni repetir validaciones técnicas.

Debes explicar de forma humana qué está bien, qué puede frenar la comprensión o el interés y qué puede hacer el creador antes de publicar.

REGLAS OBLIGATORIAS:

1. Usa exclusivamente la evidencia proporcionada.
2. No inventes asistentes, demanda, conversiones, comportamiento, popularidad ni estadísticas.
3. Si hay varios failedChecks, analiza el conjunto. No elijas arbitrariamente solo el primero.
4. "message" es DIAGNÓSTICO:
   - explica qué ocurre,
   - por qué importa,
   - y cómo afecta a la comprensión de la experiencia.
5. "recommendation" es ACCIÓN:
   - debe aportar pasos concretos,
   - debe cubrir los failedChecks relevantes,
   - y NO debe repetir con otras palabras el mismo contenido de "message".
6. Si título y descripción fallan, por ejemplo, el consejo debe explicar cómo trabajan juntos, no generar dos frases aisladas.
7. Si una mejora se presta a ello, puedes dar un ejemplo breve y realista, pero nunca inventes información que no exista en el evento.
8. No digas que algo "atraerá más gente" o "aumentará conversiones" si no existe evidencia para afirmarlo.
9. No menciones OpenAI, GPT, prompts ni modelos.
10. Escribe español natural, profesional, cercano y directo.
11. No uses lenguaje robótico como "se recomienda optimizar".
12. message debe tener aproximadamente 2 a 4 frases.
13. recommendation puede tener entre 1 y 4 acciones concretas.
14. Si realmente no hay ninguna mejora material que aportar, recommendation debe ser null.

Devuelve SOLAMENTE JSON con esta forma exacta:

{
  "title": "string",
  "message": "string",
  "recommendation": "string o null"
}
          `.trim(),
        },

        {
          role:
            "user",

          content:
            JSON.stringify(
              evidence,
            ),
        },
      ],
    });

  const content =
    completion
      .choices[0]
      ?.message
      ?.content
      ?.trim();

  if (!content) {
    throw new Error(
      "LookUp Intelligence devolvió una respuesta vacía.",
    );
  }

  const payload =
    parseGeneratedPayload(
      content,
    );

  const generatedTitle =
    getStringProperty(
      payload.title,
    );

  const generatedMessage =
    getStringProperty(
      payload.message,
    );

  let generatedRecommendation =
    getNullableStringProperty(
      payload.recommendation,
    );

  if (
    !generatedTitle ||
    !generatedMessage
  ) {
    throw new Error(
      "LookUp Intelligence devolvió una respuesta incompleta.",
    );
  }

  /*
   * Segunda barrera.
   *
   * Aunque el prompt lo prohíbe, ningún modelo generativo
   * garantiza al 100 % no repetir una idea.
   *
   * Si diagnóstico y recomendación son prácticamente lo mismo,
   * usamos la recomendación determinista construida a partir
   * de TODOS los checks fallidos.
   */

  if (
    generatedRecommendation &&
    areAdviceTextsTooSimilar(
      generatedMessage,
      generatedRecommendation,
    )
  ) {
    generatedRecommendation =
      fallback
        .recommendation;
  }

  /*
   * Y si incluso el fallback resulta conceptualmente redundante,
   * no mostramos una segunda caja solo por rellenar espacio.
   */

  if (
    generatedRecommendation &&
    areAdviceTextsTooSimilar(
      generatedMessage,
      generatedRecommendation,
    )
  ) {
    generatedRecommendation =
      null;
  }

  return {
    verdict:
      fallback.verdict,

    confidence:
      fallback.confidence,

    title:
      trimToLength(
        generatedTitle,
        MAX_TITLE_LENGTH,
      ),

    message:
      trimToLength(
        generatedMessage,
        MAX_MESSAGE_LENGTH,
      ),

    recommendation:
      generatedRecommendation
        ? trimToLength(
            generatedRecommendation,
            MAX_RECOMMENDATION_LENGTH,
          )
        : null,

    source:
      "ai",

    model,
  };
}