import {
  deleteProfileLinks,
  getMyBusinessProfile,
  saveMyBusinessProfile,
  saveMyProfile,
  saveProfileLink,
  type ProfileRow,
} from "@lookup/services";

import type {
  SettingsProfileEditorData,
} from "../components/SettingsProfileEditor";

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
  const nextFullName =
    data.fullName.trim();

  const nextProfession =
    data.profession.trim();

  const nextBio =
    data.bio.trim();

  const isBusiness =
    profile.account_type ===
    "business";

  /*
   * ============================================================
   * BUSINESS
   * ============================================================
   *
   * Antes de tocar profiles verificamos que la entidad Business
   * exista realmente.
   *
   * Así evitamos guardar solo media identidad si por algún motivo
   * business_profiles estuviera incompleto.
   */

  const businessProfile =
    isBusiness
      ? await getMyBusinessProfile(
          userId,
        )
      : null;

  if (
    isBusiness &&
    !businessProfile
  ) {
    throw new Error(
      "No se encontró la información del negocio asociada a esta cuenta.",
    );
  }

  /*
   * ============================================================
   * USERNAME
   * ============================================================
   *
   * Nombre visible y username son conceptos distintos.
   *
   * Cambiar:
   *
   * Crystian
   * → Crystian Carmona
   *
   * NO debe transformar automáticamente:
   *
   * @crystian
   * → @crystian-carmona
   *
   * El username solo cambiará mediante una función específica
   * con validación de disponibilidad.
   */

  const nextUsername =
    profile.username ?? "";

  /*
   * ============================================================
   * PERFIL CANÓNICO
   * ============================================================
   */

  const profileResult =
    await saveMyProfile({
      id: userId,

      email,

      full_name:
        nextFullName,

      username:
        nextUsername,

      avatar_url:
        avatarUrl ??
        profile.avatar_url ??
        "",

      bio:
        nextBio,

      profession:
        nextProfession,

      visibility:
        profile.visibility ??
        true,

      onboarding_completed:
        profile.onboarding_completed ??
        true,
    });

  if (
    profileResult.error
  ) {
    throw profileResult.error;
  }

  /*
   * ============================================================
   * SINCRONIZACIÓN BUSINESS
   * ============================================================
   *
   * El perfil público de empresa utiliza business_profiles.
   *
   * Por tanto:
   *
   * profiles.full_name
   * ↔ business_profiles.trade_name
   *
   * profiles.profession
   * ↔ business_profiles.sector
   *
   * El resto de información privada o estructural del negocio
   * se conserva intacta.
   */

  if (
    isBusiness &&
    businessProfile
  ) {
    await saveMyBusinessProfile({
      profile_id:
        businessProfile.profile_id,

      legal_name:
        businessProfile.legal_name,

      trade_name:
        nextFullName,

      tax_id:
        businessProfile.tax_id,

      sector:
        nextProfession,

      address:
        businessProfile.address,

      city:
        businessProfile.city,

      province:
        businessProfile.province,

      postal_code:
        businessProfile.postal_code,

      latitude:
        businessProfile.latitude,

      longitude:
        businessProfile.longitude,

      contact_email:
        businessProfile.contact_email,

      contact_phone:
        businessProfile.contact_phone,

      website:
        businessProfile.website,
    });
  }

  /*
   * ============================================================
   * REDES
   * ============================================================
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

  return {
    profile:
      profileResult.data,

    links:
      data.socialLinks,
  };
}