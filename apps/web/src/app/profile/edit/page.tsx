"use client";

import { uploadAvatar } from "@lookup/services";

import { useAuth } from "../../../components/auth-provider";

import { OnboardingForm } from "../../onboarding/components/OnboardingForm";
import { useOnboarding } from "../../onboarding/hooks/useOnboarding";

import { useEditProfile } from "./hooks/useEditProfile";

export default function EditProfilePage() {
  const { user } = useAuth();

  const { loading, data } = useEditProfile();

  const onboarding = useOnboarding(
    data ? { initialData: data } : undefined,
  );

  async function handleAvatar(file: File) {
    if (!user) return;

    const url = await uploadAvatar(user.id, file);

    onboarding.update({
      avatarUrl: url,
    });
  }

  if (loading || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Cargando...
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
      loading={false}
      canContinue={onboarding.canContinue}
      update={onboarding.update}
      onAvatar={handleAvatar}
      onBack={onboarding.previous}
      onNext={onboarding.next}
    />
  );
}