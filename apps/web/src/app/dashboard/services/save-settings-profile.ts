import {
  deleteProfileLinks,
  saveProfileLink,
  updateMyBusinessPublicProfile,
  updateMyProfile,
  type ProfileRow,
} from "@lookup/services";

import type {
  SettingsProfileEditorData,
} from "../components/SettingsProfileEditor";

type SaveSettingsProfileParams = {
  userId: string;
  profile: ProfileRow;
  data: SettingsProfileEditorData;
  avatarUrl?: string;
};

export async function saveSettingsProfile({
  userId,
  profile,
  data,
  avatarUrl,
}: SaveSettingsProfileParams) {
  const nextFullName = data.fullName.trim();
  const nextProfession = data.profession.trim();
  const nextBio = data.bio.trim();
  const nextAvatarUrl =
    avatarUrl ?? profile.avatar_url ?? "";

  const isBusiness =
    profile.account_type === "business";

  /*
   * ============================================================
   * BUSINESS
   * ============================================================
   *
   * profiles + business_profiles + profile_links
   * se actualizan dentro de UNA única transacción PostgreSQL.
   */

  if (isBusiness) {
    const updatedProfile =
      await updateMyBusinessPublicProfile({
        fullName: nextFullName,
        sector: nextProfession,
        bio: nextBio,
        city: data.businessCity.trim(),
        province: data.businessProvince.trim(),
        website: data.businessWebsite.trim(),
        interests: data.interests,
        avatarUrl: nextAvatarUrl,
        visibility: profile.visibility,
        links: data.socialLinks
          .map((link) => ({
            platform: link.platform.trim(),
            url: link.url.trim(),
          }))
          .filter(
            (link) =>
              link.platform.length > 0 &&
              link.url.length > 0,
          ),
      });

    return {
      profile: updatedProfile,
      links: data.socialLinks,
    };
  }

  /*
   * ============================================================
   * PERSON
   * ============================================================
   *
   * Username NO se toca.
   *
   * Cambiar el nombre visible jamás debe renombrar
   * silenciosamente la identidad @username.
   */

  const profileResult = await updateMyProfile(userId, {
    full_name: nextFullName,
    profession: nextProfession,
    bio: nextBio,
    interests: data.interests,
    avatar_url: nextAvatarUrl,
  });

  if (profileResult.error) {
    throw profileResult.error;
  }

  await deleteProfileLinks(userId);

  for (const link of data.socialLinks) {
    const platform = link.platform.trim();
    const url = link.url.trim();

    if (!platform || !url) {
      continue;
    }

    await saveProfileLink(
      userId,
      platform,
      url,
    );
  }

  return {
    profile: profileResult.data,
    links: data.socialLinks,
  };
}