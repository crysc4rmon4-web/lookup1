import "server-only";

import {
  getOpenAIClient,
} from "../../openai";

import type {
  EventIntelligenceConfidence,
  EventIntelligenceVerdict,
  EventLocalAudiencePreview,
  EventPrepublishAdvice,
} from "../../events/event-intelligence-types";

import type {
  EventReadinessResult,
} from "./event-readiness";

export const EVENT_PREPUBLISH_INTELLIGENCE_MODEL =
  "gpt-4o-mini";

export type EventPrepublishIntelligenceInput = {
  event: {
    title: string;

    description: string;

    category: string;

    tags:
      readonly string[];

    audience:
      readonly string[];

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
    EventReadinessResult;

  localAudience:
    EventLocalAudiencePreview;
};

function clean(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ") ||
    ""
  );
}

function formatList(
  values:
    readonly string[],
) {
  const normalized =
    values
      .map(clean)
      .filter(Boolean);

  return normalized.length >
    0
    ? normalized.join(", ")
    : "Ninguno";
}

export function getEventIntelligenceConfidence(
  localAudience:
    EventLocalAudiencePreview,
): EventIntelligenceConfidence {
  if (
    localAudience.sampleStatus ===
      "unavailable" ||
    localAudience.sampleStatus ===
      "no_local_data" ||
    localAudience.sampleStatus ===
      "insufficient_sample"
  ) {
    return "insufficient";
  }

  if (
    localAudience.sampleStatus ===
    "insufficient_related_sample"
  ) {
    return "low";
  }

  const analyzed =
    localAudience
      .analyzedProfiles ??
    0;

  const related =
    localAudience
      .relatedProfiles ??
    0;

  if (
    analyzed >= 50 &&
    related >= 15
  ) {
    return "high";
  }

  if (
    analyzed >= 15 &&
    related >= 5
  ) {
    return "medium";
  }

  return "low";
}

export function getEventIntelligenceVerdict(
  readiness:
    EventReadinessResult,
): EventIntelligenceVerdict {
  if (
    readiness.score >=
    85
  ) {
    return "works";
  }

  if (
    readiness.score >=
    50
  ) {
    return "improve";
  }

  return "learning";
}

function getAdviceTitle(
  readiness:
    EventReadinessResult,
) {
  if (
    readiness.score >=
    85
  ) {
    return "Buen punto de partida";
  }

  if (
    readiness.score >=
    70
  ) {
    return "Casi listo para publicar";
  }

  if (
    readiness.score >=
    50
  ) {
    return "Hay valor, pero todavía puede mejorar";
  }

  return "Completa la propuesta antes de publicar";
}

function buildAudienceFallbackSentence(
  input:
    EventPrepublishIntelligenceInput,
) {
  const audience =
    input.localAudience;

  switch (
    audience.sampleStatus
  ) {
    case "sufficient": {
      const related =
        audience
          .relatedProfiles ??
        0;

      const analyzed =
        audience
          .analyzedProfiles ??
        0;

      if (
        related > 0 &&
        analyzed > 0
      ) {
        return `En ${input.event.city}, LookUp ha podido analizar ${analyzed} perfiles y ${related} presentan una relación clara con la propuesta del evento.`;
      }

      return `LookUp ya dispone de muestra suficiente en ${input.event.city}, aunque todavía no detecta una audiencia local claramente relacionada con esta propuesta.`;
    }

    case "insufficient_related_sample":
      return `LookUp detecta algunas señales relacionadas en ${input.event.city}, pero todavía son demasiado pocas para mostrar una estimación responsable.`;

    case "insufficient_sample":
      return `Todavía no hay suficientes perfiles analizables en ${input.event.city} para estimar responsablemente el potencial local.`;

    case "no_local_data":
      return `LookUp todavía no dispone de perfiles analizables en ${input.event.city} para valorar el potencial local.`;

    case "unavailable":
    default:
      return "La estimación de audiencia local no está disponible en este momento, pero podemos seguir evaluando la calidad del evento.";
  }
}

export function buildFallbackEventPrepublishAdvice(
  input:
    EventPrepublishIntelligenceInput,
): EventPrepublishAdvice {
  const confidence =
    getEventIntelligenceConfidence(
      input.localAudience,
    );

  const verdict =
    getEventIntelligenceVerdict(
      input.readiness,
    );

  const audienceSentence =
    buildAudienceFallbackSentence(
      input,
    );

  const primaryImprovement =
    input.readiness
      .improvements[0] ??
    null;

  const primaryStrength =
    input.readiness
      .strengths[0] ??
    null;

  let message:
    string;

  if (
    input.readiness.score >=
      85 &&
    primaryStrength
  ) {
    message =
      `${primaryStrength} ${audienceSentence}`;
  } else if (
    primaryImprovement
  ) {
    message =
      `${audienceSentence} Antes de publicar, ${primaryImprovement
        .charAt(0)
        .toLowerCase()}${primaryImprovement.slice(
        1,
      )}`;
  } else {
    message =
      `${audienceSentence} La propuesta contiene la información principal necesaria para continuar.`;
  }

  return {
    verdict,

    confidence,

    title:
      getAdviceTitle(
        input.readiness,
      ),

    message,

    recommendation:
      primaryImprovement,

    source:
      "fallback",

    model:
      null,
  };
}

function buildLocalAudienceContext(
  localAudience:
    EventLocalAudiencePreview,
) {
  switch (
    localAudience.sampleStatus
  ) {
    case "sufficient":
      return `
Estado de muestra: suficiente
Perfiles analizables: ${
        localAudience
          .analyzedProfiles ??
        0
      }
Perfiles relacionados: ${
        localAudience
          .relatedProfiles ??
        0
      }
Perfiles con relación especialmente fuerte: ${
        localAudience
          .strongProfiles ??
        0
      }
Temas agregados presentes en la audiencia relacionada: ${
        formatList(
          localAudience
            .topInterests,
        )
      }
      `.trim();

    case "insufficient_related_sample":
      return `
Estado de muestra: existen algunas relaciones, pero son demasiado pocas para mostrar cantidades responsables.
No existe evidencia suficiente para sacar conclusiones sobre demanda local.
      `.trim();

    case "insufficient_sample":
      return `
Estado de muestra: insuficiente.
No existen suficientes perfiles analizables para estimar potencial local.
      `.trim();

    case "no_local_data":
      return `
Estado de muestra: sin datos locales analizables.
No existe evidencia para afirmar demanda, falta de demanda ni rendimiento local.
      `.trim();

    case "unavailable":
    default:
      return `
La estimación de audiencia local no está disponible temporalmente.
No existe evidencia local suficiente para sacar conclusiones de mercado.
      `.trim();
  }
}

function canGenerateAdviceWithAI(
  input:
    EventPrepublishIntelligenceInput,
) {
  const hasAuthorizedImprovement =
    input.readiness
      .improvements.length >
    0;

  const hasSufficientAudienceEvidence =
    input.localAudience
      .sampleStatus ===
    "sufficient";

  /*
   * Si el evento ya está preparado y además
   * no tenemos evidencia local suficiente,
   * GPT no tiene ninguna decisión adicional
   * responsable que tomar.
   *
   * En ese caso el fallback determinista es
   * más preciso, más barato y evita fabricar
   * recomendaciones.
   */
  return (
    hasAuthorizedImprovement ||
    hasSufficientAudienceEvidence
  );
}

export async function generateEventPrepublishAdvice(
  input:
    EventPrepublishIntelligenceInput,
): Promise<EventPrepublishAdvice> {
  if (
    !canGenerateAdviceWithAI(
      input,
    )
  ) {
    return buildFallbackEventPrepublishAdvice(
      input,
    );
  }

  const confidence =
    getEventIntelligenceConfidence(
      input.localAudience,
    );

  const verdict =
    getEventIntelligenceVerdict(
      input.readiness,
    );

  const primaryImprovement =
    input.readiness
      .improvements[0] ??
    null;

  const authorizedRecommendation =
    primaryImprovement ??
    "NINGUNA";

  const openai =
    getOpenAIClient();

  const response =
    await openai.responses.create({
      model:
        EVENT_PREPUBLISH_INTELLIGENCE_MODEL,

      instructions: `
Eres LookUp Intelligence.

Ayudas a una persona o negocio local ANTES de publicar un evento.

Tu trabajo es convertir evidencia REAL ya calculada por LookUp en una explicación breve y útil.

REGLAS OBLIGATORIAS:

- Responde siempre en español.
- Escribe entre 2 y 4 frases.
- Máximo 90 palabras.
- Habla directamente al creador.
- Utiliza únicamente la información proporcionada.
- Nunca inventes métricas.
- Nunca inventes demanda.
- Nunca predigas asistentes.
- Nunca prometas ventas, reservas, alcance o éxito.
- No uses información de perfiles individuales.
- No menciones embeddings.
- No menciones vectores.
- No menciones cosine similarity.
- No menciones pgvector.
- No menciones prompts.
- No expliques mecanismos internos.

SOBRE LA AUDIENCIA LOCAL:

- Una relación entre perfiles y evento NO equivale a intención de compra.
- Una relación entre perfiles y evento NO equivale a asistencia.
- Si la muestra es insuficiente, dilo sin sacar conclusiones de mercado.
- La ausencia de datos NO significa que el evento vaya a funcionar mal.
- La ausencia de datos NO significa que vaya a ser difícil promocionarlo.
- La ausencia de perfiles relacionados NO demuestra falta de demanda.

SOBRE LAS RECOMENDACIONES:

Recibirás un campo llamado:

RECOMENDACIÓN AUTORIZADA

Esa es la ÚNICA mejora accionable que puedes recomendar.

Si RECOMENDACIÓN AUTORIZADA es NINGUNA:

- No inventes ninguna acción nueva.
- No sugieras encuestas.
- No sugieras campañas.
- No sugieras publicidad.
- No sugieras estudios de mercado.
- No sugieras cambiar el precio.
- No sugieras cambiar la fecha.
- No sugieras cambiar la ciudad.
- No sugieras cambiar el público.
- No sugieras cambiar canales de promoción.
- No sugieras aumentar presupuesto.
- Limítate a explicar qué está bien preparado y qué sabemos o no sabemos todavía.

Si existe una RECOMENDACIÓN AUTORIZADA:

- Puedes reformularla de manera natural.
- No añadas una segunda recomendación que no aparezca en la evidencia.

SOBRE EL TONO:

- Profesional.
- Humano.
- Claro.
- Sin exageración.
- Sin halagos vacíos.
- Sin lenguaje de vendedor.
- Sin fingir certeza.

El análisis pre-publicación mide preparación y señales disponibles.
Todavía no existe rendimiento real del evento.
      `.trim(),

      input: `
EVENTO

Título:
${clean(
        input.event.title,
      )}

Descripción:
${clean(
        input.event.description,
      )}

Categoría:
${clean(
        input.event.category,
      )}

Etiquetas:
${formatList(
        input.event.tags,
      )}

Público declarado:
${formatList(
        input.event.audience,
      )}

Ciudad:
${clean(
        input.event.city,
      )}

Inicio:
${input.event.startAt}

Fin:
${input.event.endAt}

Precio:
${
        input.event.isFree
          ? "Gratis"
          : input.event
                .priceFrom !==
              null
            ? `Desde ${input.event.priceFrom} EUR`
            : "No definido"
      }

Acción externa:
${
        input.event
          .externalUrl
          ? "Sí"
          : "No"
      }


PREPARACIÓN DETERMINISTA DE LOOKUP

Puntuación:
${input.readiness.score}/100

Estado:
${input.readiness.status}

Fortalezas verificadas:
${formatList(
        input.readiness
          .strengths,
      )}

Mejoras detectadas:
${formatList(
        input.readiness
          .improvements,
      )}

RECOMENDACIÓN AUTORIZADA:
${authorizedRecommendation}


AUDIENCIA LOCAL AGREGADA

${buildLocalAudienceContext(
        input.localAudience,
      )}


Escribe únicamente el consejo final que verá el creador.
      `.trim(),

      max_output_tokens:
        280,
    });

  const message =
    response.output_text
      .trim()
      .replace(/\s+/g, " ");

  if (!message) {
    throw new Error(
      "OpenAI no devolvió un consejo pre-publicación.",
    );
  }

  return {
    verdict,

    confidence,

    title:
      getAdviceTitle(
        input.readiness,
      ),

    message,

    recommendation:
      primaryImprovement,

    source:
      "ai",

    model:
      EVENT_PREPUBLISH_INTELLIGENCE_MODEL,
  };
}