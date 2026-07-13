import { supabase } from "./supabase/client";

export async function updateMyLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
) {
  const { error } = await supabase
    .from("user_locations")
    .upsert({
      user_id: userId,
      latitude,
      longitude,
      accuracy,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}

export async function getNearbyProfiles(
  latitude: number,
  longitude: number,
  radius = 100,
) {
  const { data, error } = await supabase.rpc(
    "nearby_profiles",
    {
      my_lat: latitude,
      my_lon: longitude,
      radius,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}