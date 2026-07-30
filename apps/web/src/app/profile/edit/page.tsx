"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { uploadAvatar } from "@lookup/services";

import { useAuth } from "../../../components/auth-provider";
import { OnboardingForm } from "../../onboarding/components/OnboardingForm";
import { useOnboarding } from "../../onboarding/hooks/useOnboarding";

import { useEditProfile } from "./hooks/useEditProfile";

export default function EditProfilePage() {
  const router = useRouter();

  const { user } = useAuth();

  const { loading, data, save } = useEditProfile();

  const onboarding = useOnboarding(
    data
      ? {
        initialData: data,
      }
      : undefined,
  );

  const [saving, setSaving] = useState(false);

  async function handleAvatar(file: File) {
    if (!user) return;

    try {
      setSaving(true);

      const url = await uploadAvatar(user.id, file);

      onboarding.update({
        avatarUrl: url,
      });
    } catch {
      alert("No se pudo subir la imagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (!onboarding.canContinue || saving) return;

    if (onboarding.stepIndex < onboarding.totalSteps - 1) {
      onboarding.next();
      return;
    }

    try {
      setSaving(true);

      await save(onboarding.data);

      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("No se pudo guardar el perfil.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.replace("/dashboard");
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
      isEditing
      onCancel={handleCancel}
      step={onboarding.step}
      stepIndex={onboarding.stepIndex}
      totalSteps={onboarding.totalSteps}
      progress={onboarding.progress}
      data={onboarding.data}
      loading={saving}
      canContinue={onboarding.canContinue}
      update={onboarding.update}
      onAvatar={handleAvatar}
      onBack={onboarding.previous}
      onNext={handleNext}
    />
  );
}