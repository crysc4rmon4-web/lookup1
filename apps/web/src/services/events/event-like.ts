export type EventLikeState = {
  count: number;
  liked: boolean;
  canLike: boolean;
};
export async function requestEventLike(
  token: string,
  eventId: string,
  method: "GET" | "POST" | "DELETE",
  signal?: AbortSignal,
): Promise<EventLikeState> {
  const response = await fetch(
    `/api/events/${encodeURIComponent(eventId)}/like`,
    {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      ...(signal ? { signal } : {}),
    },
  );
  const payload = (await response.json()) as EventLikeState & { error?: string };
  if (!response.ok)
    throw new Error(payload.error ?? "No se pudieron actualizar los likes.");
  return payload as EventLikeState;
}
