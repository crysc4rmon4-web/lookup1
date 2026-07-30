"use client";

import { Navigation } from "./Navigation";
import { ProgressBar } from "./ProgressBar";

import { StepPhoto } from "./StepPhoto";
import { StepUsername } from "./StepUsername";
import { StepName } from "./StepName";
import { StepSocials } from "./StepSocials";
import { StepBio } from "./StepBio";
import { StepInterests } from "./StepInterests";
import { StepVisibility } from "./StepVisibility";

import type {
  OnboardingData,
  OnboardingStep,
} from "../types";

type Props = {
  step: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  progress: number;

  data: OnboardingData;

  loading: boolean;
  canContinue: boolean;

  update: (
    values: Partial<OnboardingData>,
  ) => void;

  onAvatar: (file: File) => void | Promise<void>;

  onBack: () => void;
  onNext: () => void;

  /**
   * Reutilización del formulario.
   * false = onboarding inicial
   * true = edición de perfil
   */
  isEditing?: boolean;

  /**
   * Solo se usa cuando isEditing=true
   */
  onCancel?: (() => void);
};

export function OnboardingForm({
  step,
  stepIndex,
  totalSteps,
  progress,
  data,
  loading,
  canContinue,
  update,
  onAvatar,
  onBack,
  onNext,
  isEditing = false,
  onCancel,
}: Props) {
  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-10">
      <section className="mx-auto w-full max-w-[430px]">

        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
          LOOKUP
        </p>

        <h1 className="mt-2 text-4xl font-black italic text-[#5D5FEF]">
          {isEditing
            ? "Editar perfil"
            : "Completa tu perfil"}
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
              onSelect={onAvatar}
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

          {step === "name" && (
            <StepName
              fullName={data.fullName}
              onChange={(value) =>
                update({
                  fullName: value,
                })
              }
            />
          )}

          {step === "socials" && (
            <StepSocials
              links={data.socialLinks}
              onChange={(value) =>
                update({
                  socialLinks: value,
                })
              }
            />
          )}

          {step === "bio" && (
            <StepBio
              bio={data.bio}
              onChange={(value) =>
                update({
                  bio: value,
                })
              }
            />
          )}

          {step === "interests" && (
            <StepInterests
              interests={data.interests}
              onChange={(value) =>
                update({
                  interests: value,
                })
              }
            />
          )}

          {step === "visibility" && (
            <StepVisibility
              visibility={data.visibility}
              onChange={(value) =>
                update({
                  visibility: value,
                })
              }
            />
          )}

        </div>

        <Navigation
          canGoBack={stepIndex > 0 && !loading}
          canContinue={canContinue && !loading}
          isLastStep={stepIndex === totalSteps - 1}
          onBack={onBack}
          onNext={onNext}
          isEditing={isEditing}
          {...(onCancel ? { onCancel } : {})}
        />

      </section>
    </main>
  );
}