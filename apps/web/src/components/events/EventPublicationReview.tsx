"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import type { CreatedEventDraft } from "@/lib/events/event-domain";
import type { EventDraftIntelligenceResult } from "@/lib/events/event-intelligence-types";
import { getEventDraftIntelligence } from "@/services/events/get-event-draft-intelligence";
import { publishEventDraft } from "@/services/events/publish-event-draft";

type Props = {
  draft: CreatedEventDraft;
  accessToken: string;
  hasImages: boolean;
  onDone: (draft: CreatedEventDraft, published?: boolean) => void;
};

export function EventPublicationReview({ draft, accessToken, hasImages, onDone }: Props) {
  const [analysis, setAnalysis] = useState<EventDraftIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const publishLock = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  // Reuse the same request across Strict Mode's effect replay.
  const requestRef = useRef<{ key: string; promise: Promise<EventDraftIntelligenceResult> } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const key = `${draft.id}:${attempt}`;
    if (requestRef.current?.key !== key) {
      requestRef.current = { key, promise: getEventDraftIntelligence(accessToken, draft.id) };
    }
    void requestRef.current.promise.then((result) => {
      if (active) setAnalysis(result);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "No se pudo completar el análisis.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken, draft.id, attempt]);

  async function publish() {
    if (publishLock.current || !analysis || !hasImages) return;
    publishLock.current = true;
    setPublishing(true);
    setError(null);
    try {
      await publishEventDraft(accessToken, draft.id);
      onDone(draft, true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo publicar. Tu borrador está guardado.");
    } finally {
      publishLock.current = false;
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-center bg-slate-950/30 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="event-review-title" onKeyDown={(event) => {
        if (event.key === "Escape" && !publishing) { event.preventDefault(); onDone(draft, false); }
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }} className="flex h-full w-full max-w-3xl flex-col bg-[#F7F8FC] shadow-2xl sm:my-4 sm:h-[calc(100%-2rem)] sm:rounded-[2rem]">
        <header className="border-b border-slate-200 bg-white p-5 sm:rounded-t-[2rem] sm:px-7">
          <p className="flex items-center gap-2 text-xs font-bold text-[#5557D8]"><Sparkles size={16} />LookUp Intelligence</p>
          <h1 id="event-review-title" tabIndex={-1} ref={headingRef} className="mt-2 text-xl font-black text-slate-950 outline-none">Revisa y publica</h1>
          <p className="mt-2 text-sm text-slate-500">Tu evento «{draft.title}» ya está guardado como borrador.</p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-7" aria-live="polite">
          {loading ? <div className="flex items-center gap-3 rounded-2xl bg-white p-5 text-sm font-semibold text-slate-600"><LoaderCircle size={20} className="animate-spin text-[#5D5FEF]" />Revisando la preparación de tu evento…</div> : null}
          {analysis ? <>
            <div className="rounded-2xl border border-[#5D5FEF]/10 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5557D8]">Preparación · {analysis.readiness.score}/100</p>
              <h2 className="mt-2 text-lg font-black text-slate-900">{analysis.advice.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{analysis.advice.message}</p>
              {analysis.advice.recommendation ? <p className="mt-3 rounded-xl bg-[#F0F0FF] p-3 text-sm leading-6 text-[#5557D8]">{analysis.advice.recommendation}</p> : null}
            </div>
            {analysis.readiness.improvements.length > 0 ? <div className="rounded-2xl bg-white p-5"><h2 className="text-sm font-bold text-slate-900">Puedes mejorar</h2><ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-5 text-slate-600">{analysis.readiness.improvements.map((item) => <li key={item}>{item}</li>)}</ul></div> : <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18} />La información esencial está completa.</p>}
            <p className="px-1 text-xs leading-5 text-slate-500">Este análisis es orientativo. Puedes publicar ahora o conservar el borrador para editarlo desde Mis eventos.</p>
          </> : null}
          {!hasImages ? <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">Para publicar necesitas al menos una imagen. Guarda el borrador y añade la portada desde Mis eventos.</p> : null}
          {error ? <div role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700"><p>{error}</p><p className="mt-2">Tu borrador sigue guardado.</p>{!analysis && !loading ? <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-2 min-h-11 font-bold underline">Reintentar análisis</button> : null}</div> : null}
        </div>
        <footer className="grid gap-2 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:rounded-b-[2rem] sm:p-5">
          <button type="button" disabled={publishing} onClick={() => onDone(draft, false)} className="min-h-12 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Dejar en borrador</button>
          <button type="button" disabled={loading || publishing || !analysis || !hasImages} onClick={() => void publish()} className="min-h-12 rounded-2xl bg-[#5D5FEF] px-4 py-3 text-sm font-bold text-white hover:bg-[#5254DF] disabled:opacity-50">{publishing ? "Publicando…" : "Publicar evento"}</button>
        </footer>
      </section>
    </div>
  );
}
