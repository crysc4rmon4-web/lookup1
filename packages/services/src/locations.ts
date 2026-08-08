import { supabase } from "./supabase/client";

export async function updateMyLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
) {
  const { data, error } = await supabase
    .from("user_locations")
    .upsert(
      {
        user_id: userId,
        latitude,
        longitude,
        accuracy,
        updated_at: new Date().toISOString(),
        is_active: true,
      },
      {
        onConflict: "user_id",
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function setRadarPresence(
  enabled: boolean,
) {
  const { error } = await supabase.rpc(
    "set_radar_presence",
    {
      enabled,
    },
  );

  if (error) {
    throw error;
  }
}