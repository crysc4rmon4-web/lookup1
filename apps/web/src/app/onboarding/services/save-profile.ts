import {
  saveMyProfile,
  saveProfileLink,
  deleteProfileLinks,
} from "@lookup/services";

import type { OnboardingData } from "../types";

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
  const profile = await saveMyProfile({
    id: userId,
    email,
    full_name: data.fullName,
    username: data.username,
    avatar_url: data.avatarUrl,
    bio: data.bio,
    visibility: data.visibility,
    onboarding_completed: completeOnboarding,
  });

  if (profile.error) {
    throw profile.error;
  }

  await deleteProfileLinks(userId);

  for (const link of data.socialLinks) {
    if (!link.platform.trim()) continue;

    if (!link.url.trim()) continue;

    await saveProfileLink(
      userId,
      link.platform.trim(),
      link.url.trim(),
    );
  }

  return profile.data;
}