"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Video,
} from "lucide-react";
import {
  EVENT_IMAGES_MAX_COUNT,
  EVENT_MEDIA_ACCEPT,
  getEventMediaError,
  getEventMediaMimeType,
  isEventVideo,
} from "@/lib/events/event-images";
import { validateSelectedEventVideo } from "@/lib/events/event-video-validation";
import { EventCoverImage } from "./EventCoverImage";
import { EventVideo } from "./event-video";

export type EditableEventImage =
  | {
      key: string;
      kind: "persisted";
      id: string;
      storagePath: string;
      publicUrl: string;
    }
  | { key: string; kind: "new"; file: File };

type Props = {
  items: EditableEventImage[];
  onChange: (items: EditableEventImage[]) => void;
  disabled?: boolean;
  loading?: boolean;
  onCheckingChange?: ((checking: boolean) => void) | undefined;
};
const isVideo = (item: EditableEventImage) =>
  item.kind === "new"
    ? getEventMediaMimeType(item.file).startsWith("video/")
    : isEventVideo(item.storagePath);

export function EventImageEditor({
  items,
  onChange,
  disabled = false,
  loading = false,
  onCheckingChange,
}: Props) {
  const [checking, setChecking] = useState(false);
  const selection = useRef(0);
  const currentItems = useRef(items);
  currentItems.current = items;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  useEffect(
    () => () => {
      selection.current += 1;
    },
    [],
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const next: Record<string, string> = {};
    items.forEach((item) => {
      if (item.kind === "new") next[item.key] = URL.createObjectURL(item.file);
    });
    setUrls(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [items]);

  function update(next: EditableEventImage[]) {
    if (next[0] && isVideo(next[0])) {
      setError(
        "La portada debe ser una foto. Coloca una foto primero o elimina los vídeos antes de quitar la última foto.",
      );
      return;
    }
    setError(null);
    onChange(next);
  }
  function move(index: number, direction: number) {
    const next = [...items];
    const target = index + direction;
    if (!next[index] || !next[target]) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    update(next);
  }
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (files.length + items.length > EVENT_IMAGES_MAX_COUNT) {
      setError("Puedes añadir hasta 5 archivos en total.");
      return;
    }
    for (const file of files) {
      const problem = getEventMediaError(file);
      if (problem) {
        setError(problem);
        return;
      }
    }
    const version = ++selection.current;
    setChecking(true);
    onCheckingChange?.(true);
    setError(null);
    try {
      for (const file of files) {
        if (getEventMediaMimeType(file).startsWith("video/"))
          await validateSelectedEventVideo(file);
      }
      if (
        version !== selection.current ||
        disabledRef.current ||
        currentItems.current !== items
      )
        return;
      const next: EditableEventImage[] = [
        ...items,
        ...files.map((file) => ({
          key: crypto.randomUUID(),
          kind: "new" as const,
          file,
        })),
      ];
      // A multi-file selection may start with a video: promote its first photo.
      if (!items.length) {
        const photo = next.findIndex((item) => !isVideo(item));
        if (photo > 0) next.unshift(...next.splice(photo, 1));
      }
      update(next);
    } catch (error) {
      if (version === selection.current)
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo comprobar el vídeo.",
        );
    } finally {
      if (version === selection.current) {
        setChecking(false);
        onCheckingChange?.(false);
      }
    }
  }
  if (loading)
    return (
      <p role="status" className="flex items-center gap-2 p-5">
        <LoaderCircle className="animate-spin" size={18} />
        Cargando galería…
      </p>
    );
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900">Fotos y vídeos</h3>
      <p className="mt-1 text-sm text-slate-500">
        Hasta 5 archivos. La primera foto será la portada. Fotos hasta 6 MB y
        vídeos de hasta 59 segundos y 50 MB, incluidos MOV de iPhone. Para
        vídeos más largos, utiliza el enlace externo del evento.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item, index) => {
          const url =
            item.kind === "persisted" ? item.publicUrl : urls[item.key];
          return (
            <article
              key={item.key}
              className="overflow-hidden rounded-2xl border border-slate-200"
            >
              <div className="relative aspect-video bg-slate-100">
                {url ? (
                  isVideo(item) ? (
                    <EventVideo
                      key={url}
                      src={url}
                      title={`Vista previa del vídeo ${index + 1}`}
                    />
                  ) : (
                    <EventCoverImage
                      src={url}
                      alt={`Foto ${index + 1}`}
                      className="absolute inset-0"
                    />
                  )
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  {isVideo(item) ? <Video size={14} /> : null}
                  {index === 0 ? "Portada" : `Archivo ${index + 1}`}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Mover archivo ${index + 1} antes`}
                    disabled={disabled || checking || index === 0}
                    onClick={() => move(index, -1)}
                    className="min-h-11 min-w-11 rounded-lg p-3 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Mover archivo ${index + 1} después`}
                    disabled={
                      disabled || checking || index === items.length - 1
                    }
                    onClick={() => move(index, 1)}
                    className="min-h-11 min-w-11 rounded-lg p-3 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar archivo ${index + 1}`}
                    disabled={disabled || checking}
                    onClick={() => update(items.filter((_, i) => i !== index))}
                    className="min-h-11 min-w-11 rounded-lg p-3 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={EVENT_MEDIA_ACCEPT}
        multiple
        disabled={disabled || checking}
        onChange={select}
        className="hidden"
      />
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {items.length}/{EVENT_IMAGES_MAX_COUNT} archivos
        </span>
        {items.length < EVENT_IMAGES_MAX_COUNT ? (
          <button
            type="button"
            disabled={disabled || checking}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-[#F0F0FF] px-4 py-3 text-sm font-bold text-[#5557D8] disabled:opacity-50"
          >
            <ImagePlus size={18} />
            Añadir fotos o vídeos
          </button>
        ) : null}
      </div>
      {checking ? (
        <p role="status" className="mt-3 text-sm text-slate-500">
          Comprobando duración del vídeo…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
