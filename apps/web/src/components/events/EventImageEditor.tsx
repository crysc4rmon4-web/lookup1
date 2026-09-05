"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGES_MAX_COUNT,
  isSupportedEventImageMimeType,
} from "@/lib/events/event-images";

import {
  EventCoverImage,
} from "./EventCoverImage";

export type EditableEventImage =
  | {
      key: string;
      kind: "persisted";
      id: string;
      storagePath: string;
      publicUrl: string;
    }
  | {
      key: string;
      kind: "new";
      file: File;
    };

type EventImageEditorProps = {
  items: EditableEventImage[];

  onChange: (
    items: EditableEventImage[],
  ) => void;

  disabled?: boolean;

  loading?: boolean;
};

export function EventImageEditor({
  items,
  onChange,
  disabled = false,
  loading = false,
}: EventImageEditorProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    previewUrls,
    setPreviewUrls,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const urls:
      Record<string, string> =
      {};

    for (
      const item
      of items
    ) {
      if (
        item.kind ===
        "new"
      ) {
        urls[item.key] =
          URL.createObjectURL(
            item.file,
          );
      }
    }

    setPreviewUrls(
      urls,
    );

    return () => {
      for (
        const url
        of Object.values(
          urls,
        )
      ) {
        URL.revokeObjectURL(
          url,
        );
      }
    };
  }, [
    items,
  ]);

  function getImageUrl(
    item: EditableEventImage,
  ) {
    if (
      item.kind ===
      "persisted"
    ) {
      return item.publicUrl;
    }

    return (
      previewUrls[
        item.key
      ] ?? ""
    );
  }

  function moveImage(
    index: number,
    direction:
      -1 | 1,
  ) {
    const nextIndex =
      index +
      direction;

    if (
      nextIndex <
        0 ||
      nextIndex >=
        items.length
    ) {
      return;
    }

    const next =
      [...items];

    const current =
      next[index];

    const target =
      next[nextIndex];

    if (
      !current ||
      !target
    ) {
      return;
    }

    next[index] =
      target;

    next[nextIndex] =
      current;

    onChange(
      next,
    );

    setError(
      null,
    );
  }

  function removeImage(
    index: number,
  ) {
    onChange(
      items.filter(
        (
          _,
          itemIndex,
        ) =>
          itemIndex !==
          index,
      ),
    );

    setError(
      null,
    );
  }

  function handleFiles(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      Array.from(
        event.target.files ??
          [],
      );

    event.target.value =
      "";

    if (
      selected.length ===
      0
    ) {
      return;
    }

    const availableSlots =
      EVENT_IMAGES_MAX_COUNT -
      items.length;

    if (
      availableSlots <=
      0
    ) {
      setError(
        `Puedes añadir como máximo ${EVENT_IMAGES_MAX_COUNT} imágenes.`,
      );

      return;
    }

    if (
      selected.length >
      availableSlots
    ) {
      setError(
        `Solo puedes añadir ${availableSlots} imagen${availableSlots === 1 ? "" : "es"} más.`,
      );

      return;
    }

    for (
      const file
      of selected
    ) {
      if (
        !isSupportedEventImageMimeType(
          file.type,
        )
      ) {
        setError(
          "Las imágenes deben ser JPG, PNG o WebP.",
        );

        return;
      }

      if (
        file.size <=
        0
      ) {
        setError(
          "Una de las imágenes seleccionadas está vacía.",
        );

        return;
      }

      if (
        file.size >
        EVENT_IMAGE_MAX_BYTES
      ) {
        setError(
          "Cada imagen puede pesar como máximo 6 MB.",
        );

        return;
      }
    }

    const newItems:
      EditableEventImage[] =
      selected.map(
        (file) => ({
          key:
            crypto.randomUUID(),

          kind:
            "new",

          file,
        }),
      );

    onChange([
      ...items,
      ...newItems,
    ]);

    setError(
      null,
    );
  }

  if (
    loading
  ) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <LoaderCircle
            size={18}
            className="animate-spin text-[#5D5FEF]"
          />

          Cargando galería…
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
            Galería
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
            Imágenes del evento
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            La primera imagen será siempre la portada. Puedes añadir hasta cinco y cambiar su orden.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#F0F0FF] px-3 py-1.5 text-xs font-black text-[#5557D8]">
          {items.length}/
          {
            EVENT_IMAGES_MAX_COUNT
          }
        </span>
      </div>

      {items.length >
      0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {items.map(
            (
              item,
              index,
            ) => {
              const imageUrl =
                getImageUrl(
                  item,
                );

              const isCover =
                index ===
                0;

              return (
                <div
                  key={
                    item.key
                  }
                  className={
                    isCover
                      ? "col-span-2"
                      : ""
                  }
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl bg-slate-100 ${
                      isCover
                        ? "aspect-[16/8]"
                        : "aspect-square"
                    }`}
                  >
                    {imageUrl ? (
                      <EventCoverImage
                        src={
                          imageUrl
                        }
                        alt={
                          isCover
                            ? "Portada del evento"
                            : `Imagen ${index + 1} del evento`
                        }
                        className="absolute inset-0"
                      />
                    ) : null}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />

                    {isCover ? (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-900 shadow-sm backdrop-blur">
                        Portada
                      </span>
                    ) : (
                      <span className="absolute left-3 top-3 rounded-full bg-slate-950/60 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                        {index +
                          1}
                      </span>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            moveImage(
                              index,
                              -1,
                            )
                          }
                          disabled={
                            disabled ||
                            index ===
                              0
                          }
                          aria-label="Mover imagen a la izquierda"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-800 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveImage(
                              index,
                              1,
                            )
                          }
                          disabled={
                            disabled ||
                            index ===
                              items.length -
                                1
                          }
                          aria-label="Mover imagen a la derecha"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-slate-800 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight
                            size={17}
                          />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            index,
                          )
                        }
                        disabled={
                          disabled
                        }
                        aria-label="Eliminar imagen"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50/95 text-rose-600 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <ImagePlus
            size={24}
            className="mx-auto text-[#5D5FEF]"
          />

          <p className="mt-3 text-sm font-black text-slate-800">
            Todavía no hay imágenes
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Añade al menos una antes de publicar el evento.
          </p>
        </div>
      )}

      <input
        ref={
          inputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={
          handleFiles
        }
      />

      {items.length <
      EVENT_IMAGES_MAX_COUNT ? (
        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={
            disabled
          }
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D9DAF8] bg-[#F8F8FF] px-4 py-3.5 text-sm font-black text-[#5557D8] transition hover:border-[#BFC0F4] hover:bg-[#F1F1FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus
            size={17}
          />

          Añadir imágenes
        </button>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm font-bold text-rose-600"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}