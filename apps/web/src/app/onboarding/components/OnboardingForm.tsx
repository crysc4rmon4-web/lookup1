"use client";

import { Navigation } from "./Navigation";
import { ProgressBar } from "./ProgressBar";

import { StepPhoto } from "./StepPhoto";
import { StepName } from "./StepName";
import { StepSocials } from "./StepSocials";
import { StepBio } from "./StepBio";
import { StepInterests } from "./StepInterests";
import { StepReview } from "./StepReview";
import { StepTerms } from "./StepTerms";
import { StepWelcome } from "./StepWelcome";

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

  onAvatar: (
    file: File,
  ) => void | Promise<void>;

  onBack: () => void;
  onNext: () => void;

  isEditing?: boolean;

  onCancel?: () => void;
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

  const isWelcome =
    step === "welcome";

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-6 py-10">

      <section className="mx-auto w-full max-w-[430px]">

        {!isWelcome && (

          <>

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

              <ProgressBar
                progress={progress}
              />

            </div>

          </>

        )}

        <div
          className={
            isWelcome
              ? "mt-8"
              : "mt-10 rounded-[2rem] bg-white p-8 shadow-sm"
          }
        >

          {step === "photo" && (

            <StepPhoto
              avatarUrl={data.avatarUrl}
              onSelect={onAvatar}
            />

          )}

          {step === "name" && (

            <StepName
              fullName={data.fullName}
              onChange={(value) =>
                update({
                  fullName: value,
                  username: value
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s]/g, "")
                    .replace(/\s+/g, "-"),
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

          {step === "review" && (

            <StepReview
              avatarUrl={data.avatarUrl}
              username={data.username}
              bio={data.bio}
              interests={data.interests}
              socialLinks={data.socialLinks}
            />

          )}

          {step === "terms" && (

            <StepTerms
              accepted={data.acceptedTerms}
              onChange={(value) =>
                update({
                  acceptedTerms: value,
                })
              }
            />

          )}

          {step === "welcome" && (

            <StepWelcome
              fullName={data.fullName}
              onFinish={onNext}
            />

          )}

        </div>

        {!isWelcome && (

          <Navigation
            canGoBack={
              stepIndex > 0 &&
              !loading
            }
            canContinue={
              canContinue &&
              !loading
            }
            isLastStep={
              stepIndex ===
              totalSteps - 1
            }
            onBack={onBack}
            onNext={onNext}
            isEditing={isEditing}
            {...(onCancel
              ? { onCancel }
              : {})}
          />

        )}

      </section>

    </main>
  );
}