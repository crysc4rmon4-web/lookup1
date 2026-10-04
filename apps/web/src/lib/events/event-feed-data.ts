import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getEventLikeSummaries } from "./event-likes";
import { EVENT_IMAGES_BUCKET, type PersistedEventImage } from "./event-images";

export async function getEventFeedData(ids: string[], viewer: string) {
  const db = getSupabaseAdminClient();
  const [media, favorites, likes] = await Promise.all([
    db
      .from("event_images")
      .select("id,event_id,storage_path,position")
      .in("event_id", ids)
      .order("position"),
    db
      .from("event_favorites")
      .select("event_id")
      .eq("profile_id", viewer)
      .in("event_id", ids),
    getEventLikeSummaries(ids, viewer),
  ]);
  if (media.error) throw media.error;
  if (favorites.error) throw favorites.error;
  const images = new Map<string, PersistedEventImage[]>();
  for (const row of media.data ?? []) {
    const items = images.get(row.event_id) ?? [];
    items.push({
      id: row.id,
      storagePath: row.storage_path,
      position: row.position,
      publicUrl: db.storage
        .from(EVENT_IMAGES_BUCKET)
        .getPublicUrl(row.storage_path).data.publicUrl,
    });
    images.set(row.event_id, items);
  }
  return {
    images,
    favorites: new Set((favorites.data ?? []).map((row) => row.event_id)),
    likes,
  };
}
