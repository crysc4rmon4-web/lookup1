"use client";

import { Navigation } from "./components/Navigation";
import { ProgressBar } from "./components/ProgressBar";
import { StepPhoto } from "./components/StepPhoto";
import { StepUsername } from "./components/StepUsername";
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
    canContinue,
  } = useOnboarding();
  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-10">
      <section className="mx-auto w-full max-w-[430px]">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
          LOOKUP
        </p>

        <h1 className="mt-2 text-4xl font-black italic text-[#5D5FEF]">
          Completa tu perfil
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Paso {stepIndex + 1} de {totalSteps}
        </p>

        <div className="mt-6">
          <ProgressBar progress={progress} />
        </div>

        <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm">
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

          {step === "username" && (
            <StepUsername
              username={data.username}
              onChange={(value) =>
                update({
                  username: value,
                })
              }
            />
          )}
        </div>

        <Navigation
          canGoBack={stepIndex > 0}
          canContinue={canContinue}
          isLastStep={stepIndex === totalSteps - 1}
          onBack={previous}
          onNext={next}
        />
      </section>
    </main>
  );
}