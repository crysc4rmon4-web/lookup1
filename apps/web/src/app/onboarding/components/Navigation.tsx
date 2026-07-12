type NavigationProps = {
  canGoBack: boolean;
  canContinue: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function Navigation({
  canGoBack,
  canContinue,
  isLastStep,
  onBack,
  onNext,
}: NavigationProps) {
  return (
    <div className="mt-10 flex gap-3">

      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className="flex-1 rounded-2xl border border-slate-200 py-4 font-bold disabled:opacity-40"
      >
        Atrás
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="flex-1 rounded-2xl bg-[#5D5FEF] py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLastStep ? "Finalizar" : "Continuar"}
      </button>

    </div>
  );
}