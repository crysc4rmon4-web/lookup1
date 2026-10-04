"use client";
import { useEffect, useRef, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  requestEventLike,
  type EventLikeState,
} from "@/services/events/event-like";

export function EventLikeButton({
  eventId,
  initial,
  readOnly = false,
}: {
  eventId: string;
  initial?: EventLikeState | null;
  readOnly?: boolean;
}) {
  const { session } = useAuth();
  const [state, setState] = useState(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    if (initial !== undefined) {
      setState(initial);
      return;
    }
    const token = session?.access_token;
    if (!token) return;
    const controller = new AbortController();
    requestEventLike(token, eventId, "GET", controller.signal)
      .then(setState)
      .catch(() => {
        if (!controller.signal.aborted) setError("Likes no disponibles");
      });
    return () => controller.abort();
  }, [eventId, initial, session?.access_token]);
  async function toggle() {
    if (!state || !session || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      setState(
        await requestEventLike(
          session.access_token,
          eventId,
          state.liked ? "DELETE" : "POST",
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="text-center">
      <button
        type="button"
        aria-label={
          readOnly
            ? "Me gusta recibidos"
            : state?.liked
              ? "Quitar Me gusta"
              : "Me gusta"
        }
        aria-pressed={readOnly ? undefined : (state?.liked ?? false)}
        title={state === null ? "Likes no disponibles" : undefined}
        disabled={
          busy || !state || readOnly || (!state.canLike && !state.liked)
        }
        onClick={() => void toggle()}
        className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border bg-white p-3 shadow-sm disabled:cursor-default ${state?.liked ? "border-rose-200 text-rose-600" : "border-slate-200 text-slate-700"}`}
      >
        {busy ? (
          <LoaderCircle size={22} className="animate-spin" />
        ) : (
          <Heart size={22} fill={state?.liked ? "currentColor" : "none"} />
        )}
      </button>
      <span
        aria-live="polite"
        className="mt-1 block text-xs font-bold text-slate-700"
      >
        {state?.count ?? "—"}
        {readOnly ? " me gusta" : ""}
      </span>
      {error ? (
        <p role="alert" className="mt-1 max-w-32 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
