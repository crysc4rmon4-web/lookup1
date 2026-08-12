import { supabase } from "./supabase/client";

export type RadarBlockedZone = {
  id: string;
  profile_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
  updated_at: string;
};

export type CreateRadarBlockedZoneInput = {
  profile_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
};

export type UpdateRadarBlockedZoneInput = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
};

/**
 * Obtiene las zonas bloqueadas pertenecientes
 * al perfil autenticado.
 *
 * La seguridad real se garantiza mediante RLS
 * en Supabase.
 */
export async function getRadarBlockedZones(
  profileId: string,
): Promise<RadarBlockedZone[]> {
  const { data, error } = await supabase
    .from("radar_blocked_zones")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as RadarBlockedZone[];
}

/**
 * Crea una nueva zona bloqueada.
 *
 * El máximo de 3 zonas se garantiza también
 * desde la base de datos mediante trigger.
 */
export async function createRadarBlockedZone(
  input: CreateRadarBlockedZoneInput,
): Promise<RadarBlockedZone> {
  const { data, error } = await supabase
    .from("radar_blocked_zones")
    .insert({
      profile_id: input.profile_id,
      name: input.name.trim(),
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      radius_meters: input.radius_meters ?? 100,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as RadarBlockedZone;
}

/**
 * Actualiza una zona existente.
 */
export async function updateRadarBlockedZone(
  zoneId: string,
  input: UpdateRadarBlockedZoneInput,
): Promise<RadarBlockedZone> {
  const payload: UpdateRadarBlockedZoneInput = {
    ...input,
  };

  if (typeof payload.name === "string") {
    payload.name = payload.name.trim();
  }

  if (typeof payload.address === "string") {
    payload.address = payload.address.trim();
  }

  const { data, error } = await supabase
    .from("radar_blocked_zones")
    .update(payload)
    .eq("id", zoneId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as RadarBlockedZone;
}

/**
 * Elimina una zona bloqueada.
 */
export async function deleteRadarBlockedZone(zoneId: string): Promise<void> {
  const { error } = await supabase
    .from("radar_blocked_zones")
    .delete()
    .eq("id", zoneId);

  if (error) {
    throw error;
  }
}
