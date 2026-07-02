import { supabase } from "./supabase/client";

export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
  city: string | null;
  instagram: string | null;
  twitter: string | null;
  visibility: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileUpsertInput = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  profession?: string | null;
  city?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  visibility?: boolean;
  onboarding_completed?: boolean;
};

export async function getMyProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
}

export async function saveMyProfile(
  payload: ProfileUpsertInput,
) {
  return supabase
    .from("profiles")
    .upsert(
      {
        ...payload,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )
    .select("*")
    .single();
}

export async function getVisibleProfiles(
  currentUserId?: string,
) {
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("visibility", true)
    .eq("onboarding_completed", true)
    .order("updated_at", {
      ascending: false,
    })
    .limit(20);

  if (currentUserId) {
    query = query.neq("id", currentUserId);
  }

  return query;
}

export async function getProfileById(
  profileId: string,
) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();
}