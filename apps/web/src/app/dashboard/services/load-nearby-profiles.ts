import { supabase } from "@lookup/services";

import type { NearbyProfile } from "@lookup/types";

export async function loadNearbyProfiles(): Promise<NearbyProfile[]> {
  const { data, error } = await supabase.rpc("nearby_profiles");

  if (error) {
    throw error;
  }

  return (data ?? []) as NearbyProfile[];
}