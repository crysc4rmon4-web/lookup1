"use client";

import {
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

import { useEffect } from "react";

export type AppToastKind =
  | "success"
  | "error";

type AppToastProps = {
  toastKey: number;
  kind: AppToastKind;
  message: string;
  onClose: () => void;
};

export function AppToast({
  toastKey,
  kind,
  message,
  onClose,
}: AppToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(
      onClose,
      4200,
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    toastKey,
    onClose,
  ]);

  const success =
    kind === "success";

  return (
    <div
      className="
        fixed
        bottom-24
        left-1/2
        z-[150]
        w-[calc(100%-2rem)]
        max-w-sm
        -translate-x-1/2
        px-2
      "
      role={
        success
          ? "status"
          : "alert"
      }
    >
      <div
        className="
          flex
          items-start
          gap-3
          rounded-[22px]
          border
          border-white/70
          bg-white/95
          p-4
          shadow-[0_20px_60px_rgba(15,23,42,0.18)]
          backdrop-blur-xl
        "
      >
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            success
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-500",
          ].join(" ")}
        >
          {success ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className={[
              "text-[10px] font-black uppercase tracking-[0.16em]",
              success
                ? "text-emerald-600"
                : "text-red-500",
            ].join(" ")}
          >
            {success
              ? "LISTO"
              : "NO SE PUDO COMPLETAR"}
          </p>

          <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}