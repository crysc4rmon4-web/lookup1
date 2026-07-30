type NavigationProps = {
  canGoBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;

  onBack: () => void;
  onNext: () => void;

  /**
   * Modo edición de perfil.
   * En este modo el último botón cambia a
   * "Guardar cambios" y aparece "Cancelar".
   */
  isEditing?: boolean;

  /**
   * Acción al cancelar la edición.
   */
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
  return (
    <div className="mt-10 flex gap-3">

      {isEditing && (
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Atrás
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="flex-1 rounded-2xl bg-[#5D5FEF] py-4 font-bold text-white transition hover:bg-[#4b4de2] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isEditing
          ? isLastStep
            ? "Guardar cambios"
            : "Continuar"
          : isLastStep
            ? "Finalizar"
            : "Continuar"}
      </button>

    </div>
  );
}