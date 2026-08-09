import {
  disableMyLocation,
  updateMyLocation,
} from "@lookup/services";

export async function updateLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
) {
  return updateMyLocation(
    userId,
    latitude,
    longitude,
    accuracy,
  );
}

export async function disableLocation(
  userId: string,
) {
  return disableMyLocation(userId);
}