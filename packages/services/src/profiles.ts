import { supabase } from "./supabase/client";

export type AccountType = "person" | "business";

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
  interests: string[];
  visibility: boolean;
  onboarding_completed: boolean;
  account_type: AccountType | null;
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
  interests?: string[];
  visibility?: boolean;
  onboarding_completed?: boolean;
  account_type?: AccountType | null;
};

export type ProfileUpdateInput = Omit<ProfileUpsertInput, "id">;

export async function getMyProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
}

export async function saveMyProfile(payload: ProfileUpsertInput) {
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

export async function updateMyProfile(
  userId: string,
  payload: ProfileUpdateInput,
) {
  return supabase
    .from("profiles")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();
}

export async function setMyAccountType(
  userId: string,
  accountType: AccountType,
  email?: string | null,
) {
  /*
   * Primero comprobamos si ya existe
   * un perfil.
   *
   * account_type se considera una
   * decisión inicial de la cuenta.
   * Si ya existe, no lo modificamos
   * accidentalmente desde esta función.
   */
  const currentProfile = await getMyProfile(userId);

  if (currentProfile.error) {
    return currentProfile;
  }

  if (currentProfile.data?.account_type) {
    return currentProfile;
  }

  return saveMyProfile({
    id: userId,
    email: email ?? null,
    account_type: accountType,
    onboarding_completed: false,
  });
}

export async function getVisibleProfiles(currentUserId?: string) {
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

export async function getProfileById(profileId: string) {
  return supabase.from("profiles").select("*").eq("id", profileId).single();
}
