"use client";

import { Building2, CalendarPlus2 } from "lucide-react";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "../../../components/auth-provider";
import { useProfileStatus } from "../../../hooks/use-profile-status";

import { getAuthenticatedDestination } from "../../../lib/account-routing";

import { BusinessOnboardingForm } from "./components/BusinessOnboardingForm";

import { useBusinessOnboarding } from "./hooks/useBusinessOnboarding";

import { saveBusinessOnboarding } from "./services/save-business-onboarding";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "No se pudo guardar el perfil de empresa.";
}

function BusinessWelcome({
  businessName,
  onFinish,
}: {
  businessName: string;
  onFinish: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-6 py-10">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-[430px] items-center">
        <div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#EEF2FF] text-[#5D5FEF]">
            <Building2 size={35} strokeWidth={2.1} />
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-[#5D5FEF]">
            LOOKUP BUSINESS
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950">
            ¡Bienvenido a LookUp!
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-500">
            <span className="font-bold text-slate-800">{businessName}</span> ya
            forma parte de la red local de LookUp.
          </p>

          <div className="mt-8 rounded-[24px] border border-[#DFE2FF] bg-[#F7F8FF] p-5 text-left">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5D5FEF] shadow-sm">
                <CalendarPlus2 size={21} />
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">Consejo</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Publica tu primer evento para empezar a conectar con personas
                  de tu ciudad.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFinish}
            className="mt-8 h-[60px] w-full rounded-[1.5rem] bg-[#5D5FEF] text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.24)] transition hover:bg-[#5153e6]"
          >
            EMPEZAR
          </button>
        </div>
      </section>
    </main>
  );
}

export default function BusinessOnboardingPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const {
    profile,
    accountType,
    loading: profileLoading,
    profileError,
  } = useProfileStatus();

  const onboarding = useBusinessOnboarding();

  const [loading, setLoading] = useState(false);

  const [showWelcome, setShowWelcome] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || profileLoading || showWelcome) {
      return;
    }

    if (!user) {
      router.replace("/login");

      return;
    }

    if (profileError) {
      return;
    }

    if (!profile || !accountType) {
      router.replace("/account-type");

      return;
    }

    if (accountType !== "business") {
      router.replace(getAuthenticatedDestination(profile));

      return;
    }

    if (profile.onboarding_completed) {
      router.replace("/dashboard");
    }
  }, [
    authLoading,
    profileLoading,
    user,
    profile,
    accountType,
    profileError,
    showWelcome,
    router,
  ]);

  async function handleNext() {
    if (loading || !onboarding.canContinue) {
      return;
    }

    if (onboarding.stepIndex < onboarding.totalSteps - 1) {
      onboarding.next();
      return;
    }

    if (!user?.email) {
      setError("No pudimos recuperar el email de tu cuenta.");

      return;
    }

    try {
      setLoading(true);
      setError(null);

      await saveBusinessOnboarding({
        userId: user.id,

        email: user.email,

        data: onboarding.data,
      });

      /*
       * Supabase ya confirmó toda la
       * operación. Solo entonces
       * eliminamos el borrador local.
       */
      onboarding.clearDraft();

      setShowWelcome(true);
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(
        "❌ Error finalizando onboarding de empresa:",
        message,
        error,
      );

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || profileLoading || !onboarding.draftReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-6">
        <p className="text-sm font-semibold text-slate-400">
          Preparando tu perfil...
        </p>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-6">
        <section className="w-full max-w-[420px] rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">
            No pudimos cargar tu perfil
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Comprueba tu conexión e inténtalo nuevamente.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-12 w-full rounded-2xl bg-[#5D5FEF] font-bold text-white"
          >
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!user || !profile || accountType !== "business") {
    return null;
  }

  if (showWelcome) {
    return (
      <BusinessWelcome
        businessName={onboarding.data.tradeName}
        onFinish={() => router.replace("/dashboard")}
      />
    );
  }

  return (
    <>
      <BusinessOnboardingForm
        step={onboarding.step}
        stepIndex={onboarding.stepIndex}
        totalSteps={onboarding.totalSteps}
        progress={onboarding.progress}
        data={onboarding.data}
        loading={loading}
        canContinue={onboarding.canContinue}
        update={onboarding.update}
        onBack={onboarding.previous}
        onNext={() => void handleNext()}
      />

      {error ? (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[500px] -translate-x-1/2 rounded-2xl border border-red-100 bg-white px-5 py-4 text-center text-sm font-bold leading-6 text-red-600 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
        >
          {error}
        </div>
      ) : null}
    </>
  );
}
