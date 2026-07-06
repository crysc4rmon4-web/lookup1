import { supabase } from "./supabase/client";

export type ProfileLink = {
  id: string;
  profile_id: string;
  platform: string;
  url: string;
  is_public: boolean;
};

export async function getProfileLinks(profileId: string) {
  return supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", profileId)
    .order("platform");
}

export async function saveProfileLink(
  profileId: string,
  platform: string,
  url: string,
) {
  return supabase
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
}

export async function deleteProfileLink(id: string) {
  return supabase
    .from("profile_links")
    .delete()
    .eq("id", id);
}