import {
  deleteProfileLinks,
  saveMyProfile,
  saveProfileLink,
  type ProfileRow,
} from "@lookup/services";

import type { SettingsProfileEditorData } from "../components/SettingsProfileEditor";

type SaveSettingsProfileParams = {
  userId: string;
  email: string;
  profile: ProfileRow;
  data: SettingsProfileEditorData;
  avatarUrl?: string;
};

export async function saveSettingsProfile({
  userId,
  email,
  profile,
  data,
  avatarUrl,
}: SaveSettingsProfileParams) {
  const nextFullName = data.fullName.trim();

  const nextUsername =
    nextFullName !== (profile.full_name ?? "").trim()
      ? normalizeUsername(nextFullName)
      : (profile.username ?? "");

  const profileResult = await saveMyProfile({
    id: userId,
    email,
    full_name: nextFullName,
    username: nextUsername,
    avatar_url: avatarUrl ?? profile.avatar_url ?? "",
    bio: data.bio.trim(),
    profession: data.profession.trim(),
    visibility: profile.visibility ?? true,
    onboarding_completed: profile.onboarding_completed ?? true,
  });

  if (profileResult.error) {
    throw profileResult.error;
  }

  /*
   * Solo actualizamos las redes si el editor
   * realmente las está enviando.
   */
  await deleteProfileLinks(userId);

  for (const link of data.socialLinks) {
    const platform = link.platform.trim();

    const url = link.url.trim();

    if (!platform || !url) {
      continue;
    }

    await saveProfileLink(userId, platform, url);
  }

  return {
    profile: profileResult.data,
    links: data.socialLinks,
  };
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");
}
