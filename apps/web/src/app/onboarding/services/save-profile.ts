import {
  deleteProfileLinks,
  saveMyProfile,
  saveProfileLink,
} from "@lookup/services";

import {
  syncCurrentProfileEmbedding,
} from "@/services/ai/sync-profile-embedding";

import type {
  OnboardingData,
} from "../types";

type SaveProfileParams = {
  userId: string;
  email: string;
  data: OnboardingData;

  /**
   * true = termina onboarding
   * false = edición de perfil
   */
  completeOnboarding?: boolean;
};

export async function saveProfile({
  userId,
  email,
  data,
  completeOnboarding = false,
}: SaveProfileParams) {
  const profile =
    await saveMyProfile({
      id:
        userId,

      email,

      full_name:
        data.fullName.trim(),

      username:
        data.username.trim(),

      avatar_url:
        data.avatarUrl ||
        null,

      bio:
        data.bio.trim() ||
        null,

      profession:
        data.profession.trim() ||
        null,

      interests:
        data.interests
          .map(
            (interest) =>
              interest.trim(),
          )
          .filter(Boolean),

      account_type:
        "person",

      visibility:
        true,

      onboarding_completed:
        completeOnboarding,
    });

  if (profile.error) {
    throw profile.error;
  }

  /*
   * profile_links continúa siendo
   * la única fuente de verdad para
   * las redes sociales.
   */
  await deleteProfileLinks(
    userId,
  );

  for (
    const link of
    data.socialLinks
  ) {
    const platform =
      link.platform.trim();

    const url =
      link.url.trim();

    if (
      !platform ||
      !url
    ) {
      continue;
    }

    await saveProfileLink(
      userId,
      platform,
      url,
    );
  }

  /*
   * ============================================================
   * PERFIL SEMÁNTICO
   * ============================================================
   *
   * Solo lo generamos cuando realmente termina onboarding.
   *
   * El perfil y sus redes ya están persistidos antes de entrar
   * aquí. La IA nunca puede impedir que una persona complete
   * correctamente su registro.
   */

  if (
    completeOnboarding
  ) {
    try {
      const embeddingResult =
        await syncCurrentProfileEmbedding();

      console.info(
        "🧠 Onboarding Persona · perfil semántico:",
        embeddingResult.status,
      );
    } catch (embeddingError) {
      console.error(
        "❌ Onboarding Persona completado, pero no pudo sincronizarse el embedding",
        embeddingError,
      );
    }
  }

  return profile.data;
}