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
) {
  const { error } = await supabase
    .from("profile_links")
    .upsert(
      {
        profile_id: profileId,
        platform,
        url,
        is_public: true,
      },
      {
        onConflict: "profile_id,platform",
      },
    );

  if (error) {
    throw error;
  }
}

export async function deleteProfileLink(
  id: string,
) {
  const { error } = await supabase
    .from("profile_links")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}