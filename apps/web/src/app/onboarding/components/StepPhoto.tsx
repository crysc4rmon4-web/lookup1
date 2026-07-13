"use client";

import Image from "next/image";

type StepPhotoProps = {
  avatarUrl: string;
  onSelect: (file: File) => void;
};

export function StepPhoto({
  avatarUrl,
  onSelect,
}: StepPhotoProps) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    onSelect(file);
  }

  return (
    <section>
      <h2 className="text-3xl font-black text-slate-900">
        Foto de perfil
      </h2>

      <p className="mt-2 text-slate-500">
        Esta será la imagen que verán los demás usuarios.
      </p>

      <div className="mt-8 flex flex-col items-center gap-6">
        <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-[#5D5FEF] bg-slate-100">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              👤
            </div>
          )}
        </div>

        <label className="cursor-pointer rounded-2xl bg-[#5D5FEF] px-6 py-4 font-bold text-white">
          Seleccionar foto

          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleChange}
          />
        </label>
      </div>
    </section>
  );
}