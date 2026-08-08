import { supabase } from "./supabase/client";

export async function getRadarPresence(): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "get_radar_presence",
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function setRadarPresence(
  enabled: boolean,
): Promise<void> {
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