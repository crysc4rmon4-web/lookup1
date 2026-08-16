"use client";

import {
  AlertTriangle,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type DeleteAccountDialogProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  accountName: string;

  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  onClearError: () => void;
};

const DELETE_WORD =
  "ELIMINAR";

export function DeleteAccountDialog({
  open,
  loading,
  error,
  accountName,
  onCancel,
  onConfirm,
  onClearError,
}: DeleteAccountDialogProps) {
  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");

  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  /*
   * ============================================================
   * APERTURA / CIERRE DEL MODAL
   * ============================================================
   *
   * La confirmación SOLO se reinicia cuando cambia `open`.
   *
   * No incluimos callbacks del padre en este efecto porque su
   * identidad puede cambiar durante renders normales del
   * Dashboard y provocaría que el texto escrito desapareciera.
   */

  useEffect(() => {
    if (!open) {
      setConfirmation("");

      return;
    }

    setConfirmation("");

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const timeout =
      window.setTimeout(
        () => {
          inputRef.current?.focus();
        },
        120,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    open,
  ]);

  /*
   * ============================================================
   * ESCAPE
   * ============================================================
   *
   * Separado del efecto que reinicia el input.
   *
   * Así un render del Dashboard puede actualizar `onCancel`
   * sin volver a borrar la palabra ELIMINAR.
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
          "Escape" &&
        !loading
      ) {
        onCancel();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    loading,
    onCancel,
  ]);

  if (!open) {
    return null;
  }

  const confirmed =
    confirmation.trim() ===
    DELETE_WORD;

  function handleConfirmationChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue =
      event.target.value.toUpperCase();

    setConfirmation(
      nextValue,
    );

    if (error) {
      onClearError();
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        flex
        items-end
        justify-center
        bg-slate-950/55
        p-0
        backdrop-blur-md
        sm:items-center
        sm:p-5
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
    >
      <button
        type="button"
        aria-label="Cerrar"
        disabled={loading}
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />

      <section
        className="
          relative
          z-10
          w-full
          max-w-md
          overflow-hidden
          rounded-t-[32px]
          border
          border-white/70
          bg-white
          shadow-[0_30px_100px_rgba(15,23,42,0.35)]
          sm:rounded-[32px]
        "
      >
        <div
          className="
            relative
            overflow-hidden
            border-b
            border-red-100
            bg-gradient-to-br
            from-red-50
            via-white
            to-rose-50
            px-5
            pb-5
            pt-6
            sm:px-6
          "
        >
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-red-200/35 blur-3xl" />

          <div className="relative flex items-start gap-4">
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-[18px]
                bg-red-500
                text-white
                shadow-[0_10px_25px_rgba(239,68,68,0.25)]
              "
            >
              <ShieldAlert
                size={21}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">
                ZONA DE RIESGO
              </p>

              <h2
                id="delete-account-title"
                className="mt-1 text-xl font-black tracking-tight text-slate-950"
              >
                Eliminar cuenta
              </h2>

              <p
                id="delete-account-description"
                className="mt-2 text-sm font-medium leading-6 text-slate-600"
              >
                Vas a eliminar
                permanentemente{" "}
                <strong className="font-black text-slate-900">
                  {accountName}
                </strong>{" "}
                de LookUp.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Cerrar"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white
                text-slate-400
                shadow-sm
                transition
                hover:text-slate-700
                disabled:opacity-40
              "
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div
            className="
              rounded-[22px]
              border
              border-red-100
              bg-red-50/70
              p-4
            "
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div>
                <p className="text-sm font-black text-red-700">
                  Esta acción no se puede
                  deshacer
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-red-700/75">
                  Se eliminarán tu cuenta,
                  perfil, presencia, zonas
                  privadas, conexiones y
                  archivos personales
                  asociados.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="delete-account-confirmation"
              className="block text-xs font-black text-slate-700"
            >
              Para continuar escribe{" "}
              <span className="text-red-500">
                ELIMINAR
              </span>
            </label>

            <input
              ref={inputRef}
              id="delete-account-confirmation"
              type="text"
              value={confirmation}
              onChange={
                handleConfirmationChange
              }
              disabled={loading}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ELIMINAR"
              className="
                mt-2
                w-full
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-4
                py-3.5
                text-sm
                font-black
                tracking-[0.08em]
                text-slate-900
                outline-none
                placeholder:font-bold
                placeholder:text-slate-300
                focus:border-red-400
                focus:ring-4
                focus:ring-red-100
                disabled:bg-slate-50
              "
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="
                mt-4
                rounded-2xl
                border
                border-red-100
                bg-red-50
                px-4
                py-3
                text-xs
                font-semibold
                leading-5
                text-red-600
              "
            >
              {error}
            </div>
          ) : null}

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
                py-3.5
                text-sm
                font-black
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:opacity-50
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => {
                void onConfirm();
              }}
              disabled={
                !confirmed ||
                loading
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-red-500
                px-4
                py-3.5
                text-sm
                font-black
                text-white
                shadow-[0_10px_25px_rgba(239,68,68,0.20)]
                transition
                hover:bg-red-600
                disabled:cursor-not-allowed
                disabled:bg-red-200
                disabled:shadow-none
              "
            >
              <Trash2 size={15} />

              {loading
                ? "Eliminando..."
                : "Eliminar cuenta"}
            </button>
          </div>

          <p className="mt-4 text-center text-[10px] font-medium leading-4 text-slate-400">
            LookUp nunca te pedirá esta
            confirmación fuera de este
            proceso.
          </p>
        </div>
      </section>
    </div>
  );
}