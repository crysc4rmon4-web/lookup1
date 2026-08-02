import {
  getMyProfile,
  getProfileLinks,
} from "@lookup/services";

import type { OnboardingData } from "../../../onboarding/types";

export async function loadProfile(userId: string): Promise<OnboardingData> {
  const profile = await getMyProfile(userId);

  if (profile.error) {
    throw profile.error;
  }

  const links = await getProfileLinks(userId);

  return {
    avatarUrl: profile.data?.avatar_url ?? "",
    username: profile.data?.username ?? "",
    fullName: profile.data?.full_name ?? "",
    profession: profile.data?.profession ?? "",
    bio: profile.data?.bio ?? "",

    interests: [],
    acceptedTerms: true,
    
    socialLinks: links.map((link) => ({
      platform: link.platform,
      url: link.url,
    })),
  };
}