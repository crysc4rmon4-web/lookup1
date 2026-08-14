import { supabase } from "./supabase/client";

export async function updateMyLocation(
  _userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("sync_radar_location", {
    p_latitude: latitude,
    p_longitude: longitude,
    p_accuracy: accuracy ?? null,
  });

  if (error) {
    throw error;
  }

  return data === true;
}

export async function disableMyLocation(userId: string) {
  const { data, error } = await supabase
    .from("user_locations")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select();

  if (error) {
    throw error;
  }

  return data;
}