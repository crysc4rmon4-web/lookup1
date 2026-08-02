export function stopWatchLocation(
  watchId: number,
) {
  navigator.geolocation.clearWatch(
    watchId,
  );
}