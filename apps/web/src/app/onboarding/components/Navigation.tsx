import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

type NavigationProps = {
  canGoBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;

  onBack: () => void;
  onNext: () => void;

  isEditing?: boolean;

  onCancel?: () => void;
};

export function Navigation({
  canGoBack,
  canContinue,
  isLastStep,
  onBack,
  onNext,
  isEditing = false,
  onCancel,
}: NavigationProps) {
  const showCancel =
    isEditing && !canGoBack;

  const showBack =
    canGoBack;

  return (
    <div className="mt-10 flex gap-3">

      {showCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      )}

      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Atrás
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] py-4 font-semibold text-white transition hover:bg-[#4B4DE2] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isEditing
          ? isLastStep
            ? "Guardar cambios"
            : "Continuar"
          : isLastStep
            ? "Finalizar"
            : "Continuar"}

        <ArrowRight size={18} />
      </button>

    </div>
  );
}