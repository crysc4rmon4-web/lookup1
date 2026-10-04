import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function getEventLikeSummaries(
  eventIds: string[],
  viewerId: string,
) {
  if (!eventIds.length)
    return new Map<string, { count: number; liked: boolean }>();
  const { data, error } = await getSupabaseAdminClient().rpc(
    "event_like_summaries",
    { event_ids: eventIds, viewer_id: viewerId },
  );
  if (error) {
    // The rest of discovery stays usable before the reviewed migration is applied.
    console.error("No se pudieron cargar los likes:", error.code);
    return null;
  }
  return new Map(
    (data as { event_id: string; like_count: number; is_liked: boolean }[]).map(
      (row) => [
        row.event_id,
        { count: Number(row.like_count), liked: row.is_liked },
      ],
    ),
  );
}
