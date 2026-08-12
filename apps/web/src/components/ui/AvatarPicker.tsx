"use client";

import Image from "next/image";
import { Camera } from "lucide-react";

type Props = {
  avatarUrl: string;
  onSelect: (file: File) => void;
};

export function AvatarPicker({ avatarUrl, onSelect }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    onSelect(file);
  }

  return (
    <div className="flex flex-col items-center">
      <label className="group relative flex h-52 w-52 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[3px] border-dashed border-[#D6DAE8] bg-[#F8F9FD] transition hover:border-[#5D5FEF]">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center text-[#7B61FF]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Camera size={28} strokeWidth={2} />
            </div>

            <span className="mt-5 text-base font-semibold text-[#111827]">
              Añadir foto
            </span>
          </div>
        )}

        <input hidden type="file" accept="image/*" onChange={handleChange} />
      </label>
    </div>
  );
}
