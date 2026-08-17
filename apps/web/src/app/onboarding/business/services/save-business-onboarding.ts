import {
  completeBusinessOnboarding,
} from "@lookup/services";

import {
  syncCurrentProfileEmbedding,
} from "@/services/ai/sync-profile-embedding";

import type {
  BusinessOnboardingData,
} from "../types";

type SaveBusinessOnboardingParams = {
  userId: string;
  email: string;
  data: BusinessOnboardingData;
};

function normalizeWebsite(
  value: string,
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function saveBusinessOnboarding({
  userId,
  email,
  data,
}: SaveBusinessOnboardingParams) {
  if (!email.trim()) {
    throw new Error(
      "No se pudo recuperar el email de la cuenta.",
    );
  }

  if (
    data.bio.trim().length <
      20 ||
    data.bio.trim().length >
      500
  ) {
    throw new Error(
      "La descripción del negocio debe tener entre 20 y 500 caracteres.",
    );
  }

  if (
    data.latitude ===
      null ||
    data.longitude ===
      null
  ) {
    throw new Error(
      "Debes verificar la dirección del negocio.",
    );
  }

  /*
   * Primero completamos de forma atómica
   * el onboarding Business.
   */
  const result =
    await completeBusinessOnboarding({
      userId,

      legalName:
        data.legalName,

      tradeName:
        data.tradeName,

      taxId:
        data.taxId,

      sector:
        data.sector,

      bio:
        data.bio,

      address:
        data.address,

      city:
        data.city,

      province:
        data.province,

      postalCode:
        data.postalCode,

      contactEmail:
        data.contactEmail,

      contactPhone:
        data.contactPhone.trim() ||
        null,

      website:
        normalizeWebsite(
          data.website,
        ),

      socialLinks:
        data.socialLinks
          .map(
            (link) => ({
              platform:
                link.platform.trim(),

              url:
                link.url.trim(),
            }),
          )
          .filter(
            (link) =>
              Boolean(
                link.platform,
              ) &&
              Boolean(
                link.url,
              ),
          ),

      avatarUrl:
        data.avatarUrl.trim() ||
        null,

      latitude:
        data.latitude,

      longitude:
        data.longitude,
    });

  /*
   * ============================================================
   * PERFIL SEMÁNTICO BUSINESS
   * ============================================================
   *
   * completeBusinessOnboarding ya terminó antes de llamar
   * a OpenAI.
   *
   * Si la IA falla:
   * - la empresa sigue creada
   * - onboarding sigue completado
   * - podrá regenerarse posteriormente
   */

  try {
    const embeddingResult =
      await syncCurrentProfileEmbedding();

    console.info(
      "🧠 Onboarding Business · perfil semántico:",
      embeddingResult.status,
    );
  } catch (embeddingError) {
    console.error(
      "❌ Onboarding Business completado, pero no pudo sincronizarse el embedding",
      embeddingError,
    );
  }

  return result;
}