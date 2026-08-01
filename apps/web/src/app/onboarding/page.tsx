"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { uploadAvatar } from "@lookup/services";

import { useAuth } from "../../components/auth-provider";
import { useProfileStatus } from "../../hooks/use-profile-status";

import { OnboardingForm } from "./components/OnboardingForm";
import { StepWelcome } from "./components/StepWelcome";

import { useOnboarding } from "./hooks/useOnboarding";
import { saveProfile } from "./services/save-profile";

export default function OnboardingPage() {
  const router = useRouter();

  const { user, loading: authLoading } =
    useAuth();

  const {
    isProfileComplete,
    loading: profileLoading,
  } = useProfileStatus();

  const [loading, setLoading] =
    useState(false);

  const [showWelcome, setShowWelcome] =
    useState(false);

  const onboarding =
    useOnboarding();

  useEffect(() => {
    if (authLoading || profileLoading) {
      return;
    }

    if (!user) {
      return;
    }

    if (isProfileComplete) {
      router.replace("/dashboard");
    }
  }, [
    authLoading,
    profileLoading,
    user,
    isProfileComplete,
    router,
  ]);

  async function handleAvatar(
    file: File,
  ) {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const url =
        await uploadAvatar(
          user.id,
          file,
        );

      onboarding.update({
        avatarUrl: url,
      });
    } catch {
      alert(
        "No se pudo subir la imagen.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    if (
      !onboarding.canContinue ||
      loading
    ) {
      return;
    }

    if (
      onboarding.stepIndex <
      onboarding.totalSteps - 1
    ) {
      onboarding.next();
      return;
    }

    if (!user?.email) {
      return;
    }

    try {
      setLoading(true);

      await saveProfile({
        userId: user.id,
        email: user.email,
        data: onboarding.data,
        completeOnboarding: true,
      });

      setShowWelcome(true);

    } catch (error) {

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(JSON.stringify(error));
      }

    } finally {

      setLoading(false);

    }
  }
  if (
    authLoading ||
    profileLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Cargando...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (showWelcome) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] px-6 py-10">

        <section className="mx-auto flex min-h-[85vh] w-full max-w-[430px] items-center">

          <StepWelcome
            fullName={onboarding.data.fullName}
            onFinish={() =>
              router.replace("/dashboard")
            }
          />

        </section>

      </main>
    );
  }

  return (

    <OnboardingForm
      step={onboarding.step}
      stepIndex={onboarding.stepIndex}
      totalSteps={onboarding.totalSteps}
      progress={onboarding.progress}
      data={onboarding.data}
      loading={loading}
      canContinue={onboarding.canContinue}
      update={onboarding.update}
      onAvatar={handleAvatar}
      onBack={onboarding.previous}
      onNext={handleNext}
    />

  );
}