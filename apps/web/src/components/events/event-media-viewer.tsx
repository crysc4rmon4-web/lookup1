"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  isEventVideo,
  type PersistedEventImage,
} from "@/lib/events/event-images";
import { EventVideo } from "./event-video";

export function EventMediaViewer({
  media,
  initialIndex,
  title,
  onClose,
}: {
  media: PersistedEventImage[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(initialIndex);
  const active = media[index] ?? media[0];
  const navigate = (step: number) =>
    setIndex((current) => (current + step + media.length) % media.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);

  if (!active) return null;
  return (
    <dialog
      ref={dialogRef}
      aria-label={`Galería ampliada de ${title}`}
      className="event-media-viewer"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLVideoElement || media.length < 2)
          return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div className="event-media-viewer-panel">
        <header className="flex items-center gap-3 p-3 sm:p-4">
          <p className="min-w-0 flex-1 truncate text-sm font-bold">{title}</p>
          <span aria-live="polite" className="text-sm">
            {index + 1} / {media.length}
          </span>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Cerrar galería"
            className="event-gallery-control"
          >
            <X size={22} />
          </button>
        </header>
        <div className="event-media-viewer-content">
          {isEventVideo(active.storagePath || active.publicUrl) ? (
            <EventVideo
              key={active.publicUrl}
              src={active.publicUrl}
              title={`Vídeo ${index + 1} de ${title}`}
            />
          ) : (
            <div
              className="relative h-full w-full"
              onTouchStart={(event) => {
                const touch =
                  event.touches.length === 1 ? event.touches[0] : null;
                gesture.current = touch
                  ? { x: touch.clientX, y: touch.clientY }
                  : null;
              }}
              onTouchCancel={() => {
                gesture.current = null;
              }}
              onTouchEnd={(event) => {
                const start = gesture.current;
                gesture.current = null;
                const end = event.changedTouches[0];
                if (!start || !end || media.length < 2 || event.touches.length)
                  return;
                const dx = end.clientX - start.x;
                const dy = end.clientY - start.y;
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
                  navigate(dx < 0 ? 1 : -1);
              }}
            >
              <Image
                key={active.publicUrl}
                src={active.publicUrl}
                alt={`Foto ${index + 1} de ${title}`}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
                draggable={false}
              />
            </div>
          )}
        </div>
        {media.length > 1 ? (
          <nav
            aria-label="Archivos de la galería"
            className="flex items-center justify-center gap-4 p-3"
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Archivo anterior"
              className="event-gallery-control"
            >
              <ChevronLeft size={22} />
            </button>
            <p className="text-xs">
              {isEventVideo(active.storagePath || active.publicUrl)
                ? "Vídeo"
                : "Foto"}{" "}
              {index + 1}
            </p>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Archivo siguiente"
              className="event-gallery-control"
            >
              <ChevronRight size={22} />
            </button>
          </nav>
        ) : null}
      </div>
    </dialog>
  );
}
