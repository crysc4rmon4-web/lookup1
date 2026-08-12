import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY no está configurada en las variables de entorno.",
  );
}

export const openai = new OpenAI({
  apiKey,
});
