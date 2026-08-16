import { supabase } from "./supabase/client";
import type { ProfileRow } from "./profiles";

export type BusinessPublicProfileLinkInput = {
  platform: string;
  url: string;
};

export type BusinessPublicProfileUpdateInput = {
  fullName: string;
  sector: string;
  bio: string;
  city: string;
  province: string;
  website: string;
  interests: string[];
  avatarUrl: string;
  visibility: boolean;
  links: BusinessPublicProfileLinkInput[];
};

export async function updateMyBusinessPublicProfile(
  input: BusinessPublicProfileUpdateInput,
): Promise<ProfileRow> {
  const { data, error } = await supabase.rpc(
    "update_my_business_public_profile",
    {
      p_full_name: input.fullName,
      p_sector: input.sector,
      p_bio: input.bio,
      p_city: input.city,
      p_province: input.province,
      p_website: input.website,
      p_interests: input.interests,
      p_avatar_url: input.avatarUrl,
      p_visibility: input.visibility,
      p_links: input.links,
    },
  );

  if (error) {
    throw error;
  }

  const profile = Array.isArray(data) ? data[0] : data;

  if (!profile) {
    throw new Error(
      "No se recibió el perfil actualizado del negocio.",
    );
  }

  return profile as ProfileRow;
}