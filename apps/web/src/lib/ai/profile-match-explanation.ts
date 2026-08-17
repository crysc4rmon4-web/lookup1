import "server-only";

import {
  getOpenAIClient,
} from "../openai";

export const PROFILE_MATCH_EXPLANATION_MODEL =
  "gpt-4o-mini";

export type ProfileMatchExplanationInput = {
  matchScore: number;

  sharedInterests: readonly string[];

  currentProfile: {
    profession: string | null;
    bio: string | null;
    interests: readonly string[];
  };

  targetProfile: {
    displayName: string;

    accountType:
      | "person"
      | "business";

    profession: string | null;
    bio: string | null;
    interests: readonly string[];
  };
};

export type GeneratedProfileMatchExplanation = {
  explanation: string;
  model: string;
};

function cleanValue(
  value: string | null,
) {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ") ||
    ""
  );
}

function formatInterests(
  interests: readonly string[],
) {
  return interests
    .map((interest) =>
      interest.trim(),
    )
    .filter(Boolean)
    .join(", ");
}

function getTargetReference(
  input: ProfileMatchExplanationInput,
) {
  const name =
    cleanValue(
      input.targetProfile.displayName,
    );

  if (name) {
    return name;
  }

  return input.targetProfile.accountType ===
    "business"
    ? "este negocio"
    : "esta persona";
}

export function buildFallbackProfileMatchExplanation(
  input: ProfileMatchExplanationInput,
) {
  const target =
    getTargetReference(
      input,
    );

  const shared =
    input.sharedInterests
      .map((interest) =>
        interest.trim(),
      )
      .filter(Boolean);

  const currentProfession =
    cleanValue(
      input.currentProfile.profession,
    );

  const targetProfession =
    cleanValue(
      input.targetProfile.profession,
    );

  const isBusiness =
    input.targetProfile.accountType ===
    "business";

  if (shared.length > 0) {
    const visibleShared =
      shared
        .slice(0, 3)
        .join(", ");

    if (isBusiness) {
      return `LookUp cree que ${target} puede interesarte. Compartís temas como ${visibleShared}, y su actividad encaja con varias señales presentes en tu perfil.`;
    }

    return `LookUp cree que puede interesarte conocer a ${target}. Compartís intereses como ${visibleShared}, además de otros puntos de contexto entre vuestros perfiles.`;
  }

  if (
    currentProfession &&
    targetProfession
  ) {
    if (isBusiness) {
      return `LookUp cree que ${target} puede ser relevante para ti. Lo que haces como ${currentProfession} guarda relación con su actividad en ${targetProfession}, aunque no compartáis exactamente los mismos intereses.`;
    }

    return `LookUp cree que puede interesarte descubrir a ${target}. Tu actividad como ${currentProfession} y lo que hace esta persona en ${targetProfession} presentan varios puntos relacionados.`;
  }

  if (isBusiness) {
    return `LookUp ha encontrado señales en tu perfil que encajan con la actividad de ${target}. Puede ser un negocio interesante para descubrir aunque la conexión no proceda de intereses idénticos.`;
  }

  return `LookUp ha encontrado varios puntos en común entre tu perfil y el de ${target}. Puede ser una persona interesante para descubrir aunque no compartáis exactamente los mismos intereses.`;
}

export async function generateProfileMatchExplanation(
  input: ProfileMatchExplanationInput,
): Promise<GeneratedProfileMatchExplanation> {
  const openai =
    getOpenAIClient();

  const targetType =
    input.targetProfile.accountType ===
    "business"
      ? "NEGOCIO"
      : "PERSONA";

  const response =
    await openai.responses.create({
      model:
        PROFILE_MATCH_EXPLANATION_MODEL,

      instructions: `
Eres LookUp AI, la capa de inteligencia que explica por qué una persona o un negocio cercano puede resultar relevante para el usuario.

El usuario acaba de descubrir un perfil REAL cerca de él.

Tu misión es responder a una única pregunta:

"¿Por qué podría interesarme descubrir este perfil?"

REGLAS OBLIGATORIAS:

- Responde siempre en español.
- Escribe exactamente 2 frases.
- Máximo 55 palabras en total.
- Debe sonar humano, natural, preciso y útil.
- No hables como un algoritmo ni como un informe.
- Usa únicamente la información proporcionada.
- Nunca inventes información.

SI EL PERFIL ES UNA PERSONA:

- Puedes usar expresiones como:
  "LookUp cree que puede interesarte conocer a..."
  "Puede merecer la pena descubrir a..."
  "Tenéis varios puntos en común..."
  "Lo que ambos hacéis se mueve en áreas relacionadas..."

- Habla de conocer, descubrir, intereses o contexto profesional.

SI EL PERFIL ES UN NEGOCIO:

- Puedes usar expresiones como:
  "LookUp cree que este negocio puede interesarte..."
  "Su actividad encaja con..."
  "Puede merecer la pena descubrirlo porque..."

- Habla de actividad, servicios, temas o intereses relevantes.

IMPORTANTE:

- Si existen intereses compartidos, menciónalos naturalmente.
- Si no existen intereses idénticos, utiliza únicamente relaciones justificadas por profesión, actividad o biografía.
- No digas que serán amigos.
- No digas que serán socios.
- No hagas afirmaciones sentimentales.
- No prometas compatibilidad.
- No hagas inferencias sensibles.
- No menciones embeddings.
- No menciones vectores.
- No menciones similitud semántica.
- No menciones algoritmos.
- No menciones inteligencia artificial.
- No expliques cómo se calculó el porcentaje.
- No repitas el porcentaje en el texto porque ya aparece visualmente.
- Evita la palabra "afinidad".
- Evita frases como "contexto semántico".
- Evita frases como "existe una conexión relevante".
- Evita lenguaje publicitario exagerado.
- Evita empezar una frase con "Puedes conocer a...".

La explicación debe conseguir que el usuario entienda rápidamente POR QUÉ ese perfil concreto puede merecer su atención.
      `.trim(),

      input: `
TIPO DE PERFIL DESCUBIERTO:
${targetType}

NIVEL DE CONEXIÓN CALCULADO POR LOOKUP:
${input.matchScore}/100

TU PERFIL

Profesión o actividad:
${
        cleanValue(
          input.currentProfile.profession,
        ) || "No indicada"
      }

Biografía:
${
        cleanValue(
          input.currentProfile.bio,
        ) || "No indicada"
      }

Intereses:
${
        formatInterests(
          input.currentProfile.interests,
        ) || "Ninguno indicado"
      }

PERFIL DESCUBIERTO

Nombre:
${getTargetReference(input)}

Profesión o actividad:
${
        cleanValue(
          input.targetProfile.profession,
        ) || "No indicada"
      }

Biografía:
${
        cleanValue(
          input.targetProfile.bio,
        ) || "No indicada"
      }

Intereses:
${
        formatInterests(
          input.targetProfile.interests,
        ) || "Ninguno indicado"
      }

INTERESES EXPLÍCITAMENTE COMPARTIDOS:
${
        formatInterests(
          input.sharedInterests,
        ) || "Ninguno"
      }

Escribe únicamente las dos frases finales que verá el usuario.
      `.trim(),

      max_output_tokens:
        180,
    });

  const explanation =
    response.output_text
      .trim()
      .replace(/\s+/g, " ");

  if (!explanation) {
    throw new Error(
      "OpenAI no devolvió una explicación del match.",
    );
  }

  return {
    explanation,

    model:
      PROFILE_MATCH_EXPLANATION_MODEL,
  };
}