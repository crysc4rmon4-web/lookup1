"use client";

import Image from "next/image";

import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGES_MAX_COUNT,
  isSupportedEventImageMimeType,
} from "@/lib/events/event-images";

type EventImagePickerProps = {
  files: File[];

  onChange: (
    files: File[],
  ) => void;

  disabled?: boolean;
};

export function EventImagePicker({
  files,
  onChange,
  disabled = false,
}: EventImagePickerProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    previewUrls,
    setPreviewUrls,
  ] =
    useState<string[]>(
      [],
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    const urls =
      files.map(
        (file) =>
          URL.createObjectURL(
            file,
          ),
      );

    setPreviewUrls(
      urls,
    );

    return () => {
      for (
        const url
        of urls
      ) {
        URL.revokeObjectURL(
          url,
        );
      }
    };
  }, [
    files,
  ]);

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

    if (
      files.length +
      selected.length >
      EVENT_IMAGES_MAX_COUNT
    ) {
      setError(
        `Puedes añadir hasta ${EVENT_IMAGES_MAX_COUNT} imágenes.`,
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
          "Solo se admiten imágenes JPG, PNG o WebP.",
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

    setError(
      null,
    );

    onChange([
      ...files,
      ...selected,
    ]);
  }

  function removeImage(
    index:
      number,
  ) {
    onChange(
      files.filter(
        (
          _,
          currentIndex,
        ) =>
          currentIndex !==
          index,
      ),
    );

    setError(
      null,
    );
  }

  function moveImage(
    index:
      number,
    direction:
      -1 | 1,
  ) {
    const targetIndex =
      index +
      direction;

    if (
      targetIndex <
        0 ||
      targetIndex >=
        files.length
    ) {
      return;
    }

    const next =
      [...files];

    const current =
      next[index];

    const target =
      next[targetIndex];

    if (
      !current ||
      !target
    ) {
      return;
    }

    next[index] =
      target;

    next[targetIndex] =
      current;

    onChange(
      next,
    );
  }

  return (
    <div className="mt-6">
      <input
        ref={
          inputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={
          disabled
        }
        onChange={
          handleFiles
        }
        className="hidden"
      />

      {files.length ===
      0 ? (
        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            inputRef.current
              ?.click()
          }
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-[#FBFCFE] px-5 text-center transition hover:border-[#5D5FEF]/40 hover:bg-[#F8F8FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
            <ImagePlus
              size={22}
            />
          </div>

          <p className="mt-3 text-sm font-black text-slate-900">
            Añadir imágenes
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Hasta 5 fotos. La primera será la portada del evento.
          </p>

          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            JPG, PNG o WebP · máximo 6 MB cada una
          </p>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {files.map(
              (
                file,
                index,
              ) => {
                const previewUrl =
                  previewUrls[
                    index
                  ];

                return (
                  <article
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className={`group relative overflow-hidden rounded-[1.35rem] border bg-slate-100 ${
                      index ===
                      0
                        ? "col-span-2 aspect-[16/9] border-[#5D5FEF]/30 sm:col-span-2"
                        : "aspect-square border-slate-200"
                    }`}
                  >
                    {previewUrl ? (
                      <Image
                        src={
                          previewUrl
                        }
                        alt={`Vista previa ${index + 1}`}
                        fill
                        unoptimized
                        sizes={
                          index ===
                          0
                            ? "(max-width: 640px) 100vw, 66vw"
                            : "(max-width: 640px) 50vw, 33vw"
                        }
                        className="object-cover"
                      />
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-3 pt-10">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-white">
                          {index ===
                          0
                            ? "Portada"
                            : `Foto ${index + 1}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Mover imagen a la izquierda"
                          disabled={
                            disabled ||
                            index ===
                              0
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              -1,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-slate-700 backdrop-blur transition hover:bg-white disabled:opacity-30"
                        >
                          <ChevronLeft
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          aria-label="Mover imagen a la derecha"
                          disabled={
                            disabled ||
                            index ===
                              files.length -
                                1
                          }
                          onClick={() =>
                            moveImage(
                              index,
                              1,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-slate-700 backdrop-blur transition hover:bg-white disabled:opacity-30"
                        >
                          <ChevronRight
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          aria-label="Eliminar imagen"
                          disabled={
                            disabled
                          }
                          onClick={() =>
                            removeImage(
                              index,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-rose-600 backdrop-blur transition hover:bg-white disabled:opacity-30"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-400">
              {files.length}/
              {
                EVENT_IMAGES_MAX_COUNT
              }{" "}
              imágenes
            </p>

            {files.length <
            EVENT_IMAGES_MAX_COUNT ? (
              <button
                type="button"
                disabled={
                  disabled
                }
                onClick={() =>
                  inputRef.current
                    ?.click()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#F0F0FF] px-3.5 py-2 text-xs font-black text-[#5557D8] transition hover:bg-[#E8E8FF] disabled:opacity-50"
              >
                <ImagePlus
                  size={15}
                />

                Añadir más
              </button>
            ) : null}
          </div>
        </>
      )}

      {error ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}