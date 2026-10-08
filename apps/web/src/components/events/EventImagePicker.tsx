"use client";

import { useMemo } from "react";
import { EventImageEditor, type EditableEventImage } from "./EventImageEditor";

export function EventImagePicker({
  files,
  onChange,
  disabled = false,
  onCheckingChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  onCheckingChange?: ((checking: boolean) => void) | undefined;
}) {
  const items = useMemo<EditableEventImage[]>(
    () =>
      files.map((file, index) => ({
        key: `${file.name}-${file.lastModified}-${index}`,
        kind: "new",
        file,
      })),
    [files],
  );
  return (
    <EventImageEditor
      items={items}
      onCheckingChange={onCheckingChange}
      disabled={disabled}
      onChange={(next) =>
        onChange(
          next.flatMap((item) => (item.kind === "new" ? [item.file] : [])),
        )
      }
    />
  );
}
