"use client";

import {
  AlertTriangle,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

type ConfirmDialogVariant =
  | "danger"
  | "privacy";

type ConfirmDialogProps = {
  open: boolean;

  title: string;
  description: string;

  confirmLabel: string;
  cancelLabel?: string;

  loading?: boolean;

  variant?: ConfirmDialogVariant;

  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading = false,
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const isPrivacy =
    variant === "privacy";

  return (
    <div
      className="
        fixed
        inset-0
        z-[120]
        flex
        items-center
        justify-center
        bg-slate-950/40
        p-4
        backdrop-blur-md
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={() => {
        if (!loading) {
          onCancel();
        }
      }}
    >
      <section
        className="
          relative
          w-full
          max-w-sm
          overflow-hidden
          rounded-[30px]
          border
          border-white/60
          bg-white
          p-6
          shadow-[0_30px_100px_rgba(15,23,42,0.25)]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Cerrar"
          className="
            absolute
            right-4
            top-4
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-slate-100
            text-slate-400
            transition
            hover:bg-slate-200
            hover:text-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X size={16} />
        </button>

        <div
          className={[
            "flex h-14 w-14 items-center justify-center rounded-2xl",
            isPrivacy
              ? "bg-rose-50 text-rose-500"
              : "bg-red-50 text-red-500",
          ].join(" ")}
        >
          {isPrivacy ? (
            <ShieldCheck size={24} />
          ) : (
            <AlertTriangle size={24} />
          )}
        </div>

        <p
          className={[
            "mt-5 text-[10px] font-black uppercase tracking-[0.2em]",
            isPrivacy
              ? "text-rose-400"
              : "text-red-400",
          ].join(" ")}
        >
          {isPrivacy
            ? "PRIVACIDAD"
            : "ACCIÓN IMPORTANTE"}
        </p>

        <h2
          id="confirm-dialog-title"
          className="
            mt-2
            pr-9
            text-xl
            font-black
            tracking-tight
            text-slate-950
          "
        >
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              font-black
              text-slate-600
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() =>
              void onConfirm()
            }
            disabled={loading}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-rose-500
              px-4
              py-3
              text-sm
              font-black
              text-white
              shadow-[0_10px_25px_rgba(244,63,94,0.20)]
              transition
              hover:bg-rose-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Trash2 size={15} />

            {loading
              ? "Eliminando..."
              : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}