import { supabase } from "@lookup/services";

import type {
  NearbyProfile,
} from "@lookup/types";


type Params = {
  currentUserId: string;
  latitude: number;
  longitude: number;
  radius?: number;
};

export async function loadNearbyProfiles({
  currentUserId,
  latitude,
  longitude,
  radius = 25,
}: Params) {
  const { data, error } =
    await supabase.rpc(
      "nearby_profiles",
      {
        current_user_id: currentUserId,
        my_lat: latitude,
        my_lon: longitude,
        radius,
      },
    );

  if (error) {
    throw error;
  }

  return (data ??
    []) as NearbyProfile[];
}