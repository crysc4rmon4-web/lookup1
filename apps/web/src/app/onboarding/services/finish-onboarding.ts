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
    throw profile.error;
  }

  for (const link of data.socialLinks) {
    if (!link.url.trim()) continue;

    const result =
      await saveProfileLink(
        userId,
        link.platform,
        link.url,
      );

    if (result.error) {
      throw result.error;
    }
  }

  return profile.data;
}