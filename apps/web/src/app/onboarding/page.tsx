"use client";

import { Navigation } from "./components/Navigation";
import { ProgressBar } from "./components/ProgressBar";
import { StepPhoto } from "./components/StepPhoto";
import { useOnboarding } from "./hooks/useOnboarding";

export default function OnboardingPage() {
  const {
    step,
    stepIndex,
    totalSteps,
    progress,
    data,
    update,
    next,
    previous,
  } = useOnboarding();

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-10">

      <section className="mx-auto flex w-full max-w-[420px] flex-col">

        <div className="mb-8">

          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
            LOOKUP
          </p>

          <h1 className="mt-2 text-4xl font-black italic tracking-[-0.05em] text-[#5D5FEF]">
            Completa tu perfil
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Paso {stepIndex + 1} de {totalSteps}
          </p>

        </div>

        <ProgressBar progress={progress} />

        <div className="mt-12 rounded-[2rem] bg-white p-8 shadow-sm">

          {step === "photo" && (
            <StepPhoto
              avatarUrl={data.avatarUrl}
              onChange={(value) =>
                update({
                  avatarUrl: value,
                })
              }
            />
          )}

        </div>

        <Navigation
          canGoBack={stepIndex > 0}
          isLastStep={stepIndex === totalSteps - 1}
          onBack={previous}
          onNext={next}
        />

      </section>

    </main>
  );
}