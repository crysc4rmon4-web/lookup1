"use client";

import { useMemo } from "react";
import { EventImageEditor, type EditableEventImage } from "./EventImageEditor";

export function EventImagePicker({
  files,
  onChange,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
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
      disabled={disabled}
      onChange={(next) =>
        onChange(
          next.flatMap((item) => (item.kind === "new" ? [item.file] : [])),
        )
      }
    />
  );
}
