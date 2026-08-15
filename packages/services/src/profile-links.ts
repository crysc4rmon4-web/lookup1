import { supabase } from "./supabase/client";

export type ProfileLink = {
  id: string;
  profile_id: string;
  platform: string;
  url: string;
  is_public: boolean;
};

export async function getProfileLinks(
  profileId: string,
): Promise<ProfileLink[]> {
  const { data, error } = await supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", profileId)
    .order("platform");

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileLink[];
}

/*
 * ============================================================
 * LINKS PÚBLICOS
 * ============================================================
 *
 * Utilizado por /profile/[id].
 *
 * Aunque RLS ya protege la tabla,
 * expresamos explícitamente la intención
 * de la consulta:
 *
 * únicamente enlaces publicados.
 */
export async function getPublicProfileLinks(
  profileId: string,
): Promise<ProfileLink[]> {
  const { data, error } = await supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_public", true)
    .order("platform");

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileLink[];
}

export async function saveProfileLink(
  profileId: string,
  platform: string,
  url: string,
): Promise<void> {
  if (!url.trim()) {
    return;
  }

  const { error } = await supabase
    .from("profile_links")
    .insert({
      profile_id: profileId,
      platform,
      url,
      is_public: true,
    });

  if (error) {
    throw error;
  }
}

/**
 * Elimina una red concreta.
 */
export async function deleteProfileLink(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("profile_links")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Elimina todas las redes del usuario.
 * Se utiliza antes de volver a guardarlas
 * para mantener la sincronización.
 */
export async function deleteProfileLinks(
  profileId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profile_links")
    .delete()
    .eq("profile_id", profileId);

  if (error) {
    throw error;
  }
}