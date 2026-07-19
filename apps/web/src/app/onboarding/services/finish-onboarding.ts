import {
  saveMyProfile,
  saveProfileLink,
} from "@lookup/services";

import type { OnboardingData } from "../types";

type Params = {
  userId: string;
  email: string;
  data: OnboardingData;
};

export async function finishOnboarding({
  userId,
  email,
  data,
}: Params) {
  console.log("========== FINISH ONBOARDING ==========");
  console.log("USER ID:", userId);
  console.log("EMAIL:", email);
  console.log("DATA:");
  console.dir(data);

  const profile = await saveMyProfile({
    id: userId,
    email,
    full_name: data.fullName,
    username: data.username,
    avatar_url: data.avatarUrl,
    bio: data.bio,
    visibility: data.visibility,
    onboarding_completed: true,
  });

  if (profile.error) {
    console.error("ERROR GUARDANDO PROFILE");
    console.dir(profile.error);
    throw profile.error;
  }

  console.log("✅ PROFILE GUARDADO");

  for (const link of data.socialLinks) {
    console.log("LINK:");
    console.dir(link);

    if (!link.platform.trim()) {
      console.log("⏭ Plataforma vacía, se omite");
      continue;
    }

    if (!link.url.trim()) {
      console.log("⏭ Usuario vacío, se omite");
      continue;
    }

    try {
      await saveProfileLink(
        userId,
        link.platform,
        link.url.trim(),
      );

      console.log("✅ LINK GUARDADO");
    } catch (error) {
      console.error("❌ ERROR GUARDANDO LINK");
      console.dir(error);

      throw error;
    }
  }

  console.log("🎉 ONBOARDING COMPLETADO");

  return profile.data;
}