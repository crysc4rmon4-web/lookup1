"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  uploadAvatar,
} from "@lookup/services";

import { useAuth } from "../../components/auth-provider";
import { useProfileStatus } from "../../hooks/use-profile-status";

import { OnboardingForm } from "./components/OnboardingForm";
import { StepWelcome } from "./components/StepWelcome";

import { useOnboarding } from "./hooks/useOnboarding";

import {
  saveProfile,
} from "./services/save-profile";

export default function OnboardingPage() {
  const router =
    useRouter();

  const {
    user,
    loading:
      authLoading,
  } = useAuth();

  const {
    profile,
    accountType,
    isProfileComplete,
    loading:
      profileLoading,
    profileError,
  } =
    useProfileStatus();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    showWelcome,
    setShowWelcome,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  /**
   * La persistencia se activa únicamente
   * para el onboarding inicial.
   *
   * Otros consumidores de useOnboarding,
   * como edición de perfil, permanecen
   * sin borrador local.
   */
  const onboarding =
    useOnboarding({
      persistDraft: true,
    });

  useEffect(() => {
    if (
      authLoading ||
      profileLoading ||
      showWelcome
    ) {
      return;
    }

    if (!user) {
      router.replace(
        "/login",
      );

      return;
    }

    if (profileError) {
      return;
    }

    /**
     * Una cuenta nueva todavía puede
     * no tener tipo seleccionado.
     */
    if (
      !profile ||
      !accountType
    ) {
      router.replace(
        "/account-type",
      );

      return;
    }

    /**
     * Una empresa nunca debe entrar
     * manualmente al onboarding Persona.
     */
    if (
      accountType !==
      "person"
    ) {
      router.replace(
        "/onboarding/business",
      );

      return;
    }

    if (
      isProfileComplete
    ) {
      onboarding.clearDraft();

      router.replace(
        "/dashboard",
      );
    }
  }, [
    authLoading,
    profileLoading,
    user,
    profile,
    accountType,
    isProfileComplete,
    profileError,
    showWelcome,
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
      setError(null);

      const url =
        await uploadAvatar(
          user.id,
          file,
        );

      onboarding.update({
        avatarUrl: url,
      });
    } catch (error) {
      console.error(
        "❌ Error subiendo avatar:",
        error,
      );

      setError(
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

    if (
      !user?.email
    ) {
      setError(
        "No se pudo recuperar el email de tu cuenta.",
      );

      return;
    }

    try {
      setLoading(true);
      setError(null);

      await saveProfile({
        userId:
          user.id,

        email:
          user.email,

        data:
          onboarding.data,

        completeOnboarding:
          true,
      });

      /**
       * Solo eliminamos el borrador
       * después de que Supabase haya
       * confirmado correctamente el
       * onboarding.
       */
      onboarding.clearDraft();

      setShowWelcome(
        true,
      );
    } catch (error) {
      console.error(
        "❌ Error finalizando onboarding Persona:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar tu perfil.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    authLoading ||
    profileLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
        <p className="text-sm font-semibold text-slate-400">
          Preparando tu
          perfil...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (profileError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-6">
        <section className="w-full max-w-[420px] rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">
            No pudimos cargar
            tu perfil
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Comprueba tu
            conexión e
            inténtalo
            nuevamente.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 h-12 w-full rounded-2xl bg-[#5D5FEF] font-bold text-white"
          >
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (
    !onboarding.draftReady
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
        <p className="text-sm font-semibold text-slate-400">
          Recuperando tu
          progreso...
        </p>
      </main>
    );
  }

  if (
    accountType !==
      "person" ||
    isProfileComplete
  ) {
    return null;
  }

  if (showWelcome) {
    return (
      <main className="min-h-screen bg-[#F7F8FC] px-6 py-10">
        <section className="mx-auto flex min-h-[85vh] w-full max-w-[430px] items-center">
          <StepWelcome
            fullName={
              onboarding.data
                .fullName
            }
            onFinish={() =>
              router.replace(
                "/dashboard",
              )
            }
          />
        </section>
      </main>
    );
  }

  return (
    <>
      <OnboardingForm
        step={
          onboarding.step
        }
        stepIndex={
          onboarding.stepIndex
        }
        totalSteps={
          onboarding.totalSteps
        }
        progress={
          onboarding.progress
        }
        data={
          onboarding.data
        }
        loading={
          loading
        }
        canContinue={
          onboarding.canContinue
        }
        update={
          onboarding.update
        }
        onAvatar={
          handleAvatar
        }
        onBack={
          onboarding.previous
        }
        onNext={() =>
          void handleNext()
        }
      />

      {error ? (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[460px] -translate-x-1/2 rounded-2xl border border-red-100 bg-white px-5 py-4 text-center text-sm font-bold leading-6 text-red-600 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
        >
          {error}
        </div>
      ) : null}
    </>
  );
}