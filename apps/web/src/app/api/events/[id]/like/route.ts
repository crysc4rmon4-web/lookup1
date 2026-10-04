import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getEventLikeSummaries } from "@/lib/events/event-likes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function handle(request: Request, context: Context) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1]
    ?.trim();
  if (!token) return json({ error: "No autorizado." }, 401);
  const { id } = await context.params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    return json({ error: "Evento no válido." }, 400);
  try {
    const db = getSupabaseAdminClient();
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user)
      return json({ error: "La sesión no es válida." }, 401);
    const { data: event, error } = await db
      .from("events")
      .select("creator_profile_id,status,end_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const owner = event?.creator_profile_id === auth.user.id;
    if (!event || (!owner && event.status !== "published"))
      return json({ error: "Evento no disponible." }, 404);
    const canLike =
      !owner &&
      event.status === "published" &&
      new Date(event.end_at).getTime() > Date.now();
    if (request.method === "POST") {
      if (!canLike)
        return json({ error: "No puedes dar Me gusta a este evento." }, 409);
      const { error: insertError } = await db
        .from("event_likes")
        .insert({ event_id: id, profile_id: auth.user.id });
      if (insertError && insertError.code !== "23505") throw insertError;
    } else if (request.method === "DELETE") {
      const { error: deleteError } = await db
        .from("event_likes")
        .delete()
        .eq("event_id", id)
        .eq("profile_id", auth.user.id);
      if (deleteError) throw deleteError;
    }
    const summaries = await getEventLikeSummaries([id], auth.user.id);
    const state = summaries?.get(id);
    if (!state)
      return json({ error: "Los likes todavía no están disponibles." }, 503);
    return json({ ...state, canLike });
  } catch (error) {
    console.error("Error procesando likes:", error);
    return json(
      { error: "No se pudieron actualizar los likes. Inténtalo de nuevo." },
      503,
    );
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
