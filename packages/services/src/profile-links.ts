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

export async function saveProfileLink(
  profileId: string,
  platform: string,
  url: string,
): Promise<void> {
  if (!url.trim()) return;

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