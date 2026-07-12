"use client";

type StepPhotoProps = {
  avatarUrl: string;
  onChange: (value: string) => void;
};

export function StepPhoto({
  avatarUrl,
  onChange,
}: StepPhotoProps) {
  return (
    <section className="flex flex-col items-center">

      <h2 className="text-3xl font-black text-slate-900">
        Tu foto
      </h2>

      <p className="mt-2 text-center text-slate-500">
        Esta será la imagen que verán las personas cerca de ti.
      </p>

      <div className="mt-10 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-[#5D5FEF] bg-slate-50">

        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl">
            📷
          </span>
        )}

      </div>

      <input
        className="mt-8 w-full rounded-2xl border border-slate-200 p-4"
        placeholder="Pega temporalmente la URL de una imagen"
        value={avatarUrl}
        onChange={(e) => onChange(e.target.value)}
      />

      <p className="mt-3 text-center text-xs text-slate-400">
        En el siguiente bloque conectaremos este paso con Supabase Storage.
      </p>

    </section>
  );
}