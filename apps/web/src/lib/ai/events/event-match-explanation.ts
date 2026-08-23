import "server-only";

import {
  getOpenAIClient,
} from "../../openai";

export const EVENT_MATCH_EXPLANATION_MODEL =
  "gpt-4o-mini";

export type EventMatchExplanationInput = {
  relevanceScore:
    number;

  matchedInterests:
    readonly string[];

  currentProfile: {
    profession:
      string | null;

    bio:
      string | null;

    interests:
      readonly string[];
  };

  event: {
    title:
      string;

    description:
      string;

    category:
      string;

    tags:
      readonly string[];

    audience:
      readonly string[];
  };
};

export type GeneratedEventMatchExplanation = {
  explanation:
    string;

  model:
    string;
};

function cleanValue(
  value:
    string | null,
) {
  return (
    value
      ?.trim()
      .replace(
        /\s+/g,
        " ",
      ) ||
    ""
  );
}

function cleanList(
  values:
    readonly string[],
) {
  return values
    .map(
      (
        value,
      ) =>
        value
          .trim()
          .replace(
            /\s+/g,
            " ",
          ),
    )
    .filter(Boolean);
}

function formatList(
  values:
    readonly string[],
) {
  return cleanList(
    values,
  ).join(
    ", ",
  );
}

function getVisibleEventTopic(
  input:
    EventMatchExplanationInput,
) {
  const category =
    cleanValue(
      input.event.category,
    );

  const tags =
    cleanList(
      input.event.tags,
    );

  return (
    tags[0] ||
    category ||
    "su temática principal"
  );
}

export function buildFallbackEventMatchExplanation(
  input:
    EventMatchExplanationInput,
) {
  const matched =
    cleanList(
      input.matchedInterests,
    );

  const topic =
    getVisibleEventTopic(
      input,
    );

  if (
    matched.length >
    0
  ) {
    const visibleMatches =
      matched
        .slice(
          0,
          3,
        )
        .join(
          ", ",
        );

    if (
      input.relevanceScore >=
      70
    ) {
      return `Este evento tiene bastante sentido para ti porque conecta directamente con temas de tu perfil como ${visibleMatches}. Además, su enfoque en ${topic} puede darte un contexto útil para descubrir ideas, actividades o personas relacionadas.`;
    }

    return `Hay varios puntos que pueden encajarte, especialmente ${visibleMatches}. El enfoque en ${topic} puede merecer una mirada aunque no todo el evento coincida exactamente con tus intereses habituales.`;
  }

  if (
    input.relevanceScore >=
    70
  ) {
    return `Este evento encaja bastante bien con el contexto general de tu perfil, aunque la conexión no venga de etiquetas idénticas. Su enfoque en ${topic} parece suficientemente relacionado como para que merezca la pena revisarlo.`;
  }

  if (
    input.relevanceScore >=
    50
  ) {
    return `Hay una relación razonable entre lo que muestras en tu perfil y este evento, aunque no sea una coincidencia directa de intereses. Su enfoque en ${topic} puede resultarte útil dependiendo de lo que estés buscando ahora.`;
  }

  if (
    input.relevanceScore >=
    35
  ) {
    return `Este evento comparte algunos puntos de contexto con tu perfil, pero no aparece entre las coincidencias más claras. Puede tener sentido si ahora te interesa explorar algo relacionado con ${topic}.`;
  }

  return `Este evento no parece de los más alineados con lo que muestras actualmente en tu perfil. Aun así, su enfoque en ${topic} puede ser interesante si te apetece salir de tus temas habituales y descubrir algo diferente.`;
}

export async function generateEventMatchExplanation(
  input:
    EventMatchExplanationInput,
): Promise<GeneratedEventMatchExplanation> {
  const openai =
    getOpenAIClient();

  const response =
    await openai.responses.create({
      model:
        EVENT_MATCH_EXPLANATION_MODEL,

      instructions: `
Eres LookUp Intelligence, la capa que ayuda a una persona a decidir si un evento puede merecer su atención.

No eres un vendedor.
No eres un recomendador entusiasta.
No intentas convencer al usuario.

Compórtate como un colega informado, observador y útil que ha entendido tanto su perfil como el evento y le explica la relación de forma sencilla.

Tu misión es responder:

"¿Por qué puede tener sentido para mí este evento?"

REGLAS OBLIGATORIAS:

- Responde siempre en español.
- Escribe exactamente 2 frases.
- Máximo 65 palabras en total.
- Usa lenguaje humano, claro, natural y adulto.
- Sé concreto antes que espectacular.
- Utiliza únicamente la información proporcionada.
- Nunca inventes intereses, objetivos, experiencia o intenciones.
- No prometas que el evento gustará.
- No prometas resultados.
- No afirmes que el usuario debería asistir.
- No utilices lenguaje publicitario.
- No exageres una conexión débil.
- Si la relevancia es baja, dilo con tacto.
- Si existen coincidencias explícitas, puedes mencionarlas.
- Si no existen coincidencias literales, explica únicamente relaciones que puedan justificarse por profesión, bio, intereses, categoría, descripción, etiquetas o público.
- No hagas inferencias sensibles.
- No menciones embeddings.
- No menciones vectores.
- No menciones similitud coseno.
- No menciones algoritmos.
- No menciones inteligencia artificial.
- No expliques cómo se calculó el score.
- No repitas el porcentaje porque ya aparecerá visualmente.
- Evita frases vacías como "este evento es perfecto para ti".
- Evita "recomendamos encarecidamente".
- Evita sonar como publicidad.
- Evita comenzar siempre con "LookUp cree".
- Puedes usar expresiones naturales como:
  "Aquí hay una conexión bastante clara..."
  "Puede tener sentido para ti porque..."
  "Hay algunos puntos que encajan..."
  "No es de las coincidencias más directas, pero..."
  "Lo interesante en tu caso es..."

TONO:

Sutil.
Elocuente.
Cercano.
Seguro cuando existen datos.
Prudente cuando no existen.
Útil para tomar una decisión.

La explicación debe aportar información real, no simplemente reformular el porcentaje.
      `.trim(),

      input: `
NIVEL DE RELEVANCIA CALCULADO POR LOOKUP:
${input.relevanceScore}/100

TU PERFIL

Profesión o actividad:
${
  cleanValue(
    input.currentProfile.profession,
  ) ||
  "No indicada"
}

Biografía:
${
  cleanValue(
    input.currentProfile.bio,
  ) ||
  "No indicada"
}

Intereses:
${
  formatList(
    input.currentProfile.interests,
  ) ||
  "Ninguno indicado"
}

EVENTO

Título:
${cleanValue(
  input.event.title,
)}

Descripción:
${cleanValue(
  input.event.description,
)}

Categoría:
${cleanValue(
  input.event.category,
)}

Etiquetas:
${
  formatList(
    input.event.tags,
  ) ||
  "Ninguna"
}

Público indicado por el creador:
${
  formatList(
    input.event.audience,
  ) ||
  "No indicado"
}

COINCIDENCIAS EXPLÍCITAS ENTRE INTERESES Y EVENTO:
${
  formatList(
    input.matchedInterests,
  ) ||
  "Ninguna coincidencia literal"
}

Escribe únicamente las dos frases que verá el usuario.
      `.trim(),

      max_output_tokens:
        190,
    });

  const explanation =
    response.output_text
      .trim()
      .replace(
        /\s+/g,
        " ",
      );

  if (!explanation) {
    throw new Error(
      "OpenAI no devolvió una explicación de relevancia del evento.",
    );
  }

  return {
    explanation,

    model:
      EVENT_MATCH_EXPLANATION_MODEL,
  };
}