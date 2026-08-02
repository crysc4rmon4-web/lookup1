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
    })
    .select();

  console.log(result);

  if (result.error) {
    throw result.error;
  }

  return result.data;
}