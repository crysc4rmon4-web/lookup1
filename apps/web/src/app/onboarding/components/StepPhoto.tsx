"use client";

import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { SectionTitle } from "@/components/ui/SectionTitle";

type StepPhotoProps = {
  avatarUrl: string;
  onSelect: (file: File) => void;
};

export function StepPhoto({ avatarUrl, onSelect }: StepPhotoProps) {
  return (
    <section className="flex min-h-[560px] flex-col">
      <SectionTitle
        title="Tu foto"
        description="Añade una foto para que otras personas puedan reconocerte más fácilmente."
      />

      <div className="mt-10 flex flex-1 items-center justify-center">
        <AvatarPicker avatarUrl={avatarUrl} onSelect={onSelect} />
      </div>

      <p className="mt-10 text-center text-sm font-medium tracking-wide text-[#98A2B3]">
        OPCIONAL · PUEDES CONTINUAR SIN AÑADIR UNA FOTO
      </p>
    </section>
  );
}
