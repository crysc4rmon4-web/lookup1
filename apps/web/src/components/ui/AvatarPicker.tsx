"use client";

import Image from "next/image";

type Props = {
  avatarUrl: string;
  onSelect: (file: File) => void;
};

export function AvatarPicker({
  avatarUrl,
  onSelect,
}: Props) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    onSelect(file);
  }

  return (
    <div className="flex flex-col items-center">

      <div className="relative h-40 w-40 overflow-hidden rounded-full border-[6px] border-[#5D5FEF] bg-[#EEF2FF] shadow-lg">

        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            👤
          </div>
        )}

      </div>

      <label className="mt-8 cursor-pointer rounded-full bg-[#111827] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#1F2937]">

        Elegir fotografía

        <input
          hidden
          accept="image/*"
          type="file"
          onChange={handleChange}
        />

      </label>

    </div>
  );
}