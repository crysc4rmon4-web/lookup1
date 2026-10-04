"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export function EventShareButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState("");
  async function share() {
    const url = new URL(
      `/events/${encodeURIComponent(eventId)}`,
      window.location.origin,
    ).href;
    setMessage("");
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Enlace copiado");
    } catch {
      setFallback(url);
      setMessage("Copia este enlace");
    }
  }
  return (
    <div className="text-center">
      <button
        type="button"
        aria-label={`Compartir ${title}`}
        onClick={() => void share()}
        className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm"
      >
        <Send size={22} />
      </button>
      <span className="mt-1 block text-[10px] font-semibold text-slate-600">
        Enviar
      </span>
      <span role="status" className="block max-w-28 text-xs text-slate-700">
        {message}
      </span>
      {fallback ? (
        <input
          aria-label="Enlace para compartir"
          readOnly
          value={fallback}
          onFocus={(e) => e.target.select()}
          className="mt-1 w-24 rounded border p-1 text-xs"
        />
      ) : null}
    </div>
  );
}
