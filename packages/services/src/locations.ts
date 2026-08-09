import { supabase } from "./supabase/client";

export async function updateMyLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
) {
  console.log("📍 updateMyLocation", {
    userId,
    latitude,
    longitude,
    accuracy,
  });

  const result = await supabase
    .from("user_locations")
    .upsert({
      user_id: userId,
      latitude,
      longitude,
      accuracy,
      updated_at: new Date().toISOString(),
      is_active: true,
    })
    .select();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export async function disableMyLocation(
  userId: string,
) {
  console.log("📍 disableMyLocation", {
    userId,
  });

  const result = await supabase
    .from("user_locations")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }

  return result.data;
}