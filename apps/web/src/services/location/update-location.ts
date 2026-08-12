import { updateMyLocation } from "@lookup/services";

export async function updateLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
) {
  return updateMyLocation(userId, latitude, longitude, accuracy);
}
