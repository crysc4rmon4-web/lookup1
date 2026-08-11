"use client";

import {
  Building2,
  ChevronRight,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  setMyAccountType,
  type AccountType,
} from "@lookup/services";

import { useAuth } from "../../components/auth-provider";
import { useProfileStatus } from "../../hooks/use-profile-status";

import {
  getAuthenticatedDestination,
  getOnboardingRoute,
} from "../../lib/account-routing";

type AccountOption = {
  type: AccountType;
  title: string;
  description: string;
  icon:
    | typeof UserRound
    | typeof Building2;
};

const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    type: "person",
    title: "Persona",
    description:
      "Descubre personas, actividades y oportunidades cerca de ti.",
    icon: UserRound,
  },
  {
    type: "business",
    title: "Empresa",
    description:
      "Da visibilidad a tu negocio, publica eventos y conecta con personas cercanas.",
    icon: Building2,
  },
];

export default function AccountTypePage() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const {
    profile,
    loading: profileLoading,
  } = useProfileStatus();

  const [
    savingType,
    setSavingType,
  ] =
    useState<AccountType | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    if (
      authLoading ||
      profileLoading
    ) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    /*
     * Si la cuenta ya eligió tipo,
     * jamás mostramos nuevamente
     * este selector.
     */
    if (profile?.account_type) {
      router.replace(
        getAuthenticatedDestination(
          profile,
        ),
      );
    }
  }, [
    authLoading,
    profileLoading,
    user,
    profile,
    router,
  ]);

  async function handleSelect(
    accountType: AccountType,
  ) {
    if (
      !user ||
      savingType
    ) {
      return;
    }

    setSavingType(accountType);
    setError(null);

    try {
      const {
        data,
        error:
          saveError,
      } =
        await setMyAccountType(
          user.id,
          accountType,
          user.email ?? null,
        );

      if (saveError) {
        throw saveError;
      }

      if (!data) {
        throw new Error(
          "No se pudo crear el perfil.",
        );
      }

      router.replace(
        getOnboardingRoute(
          accountType,
        ),
      );
    } catch (error) {
      console.error(
        "❌ Error guardando tipo de cuenta",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el tipo de cuenta.",
      );
    } finally {
      setSavingType(null);
    }
  }

  if (
    authLoading ||
    profileLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-6">
        <p className="text-sm font-semibold text-slate-400">
          Preparando tu cuenta...
        </p>
      </main>
    );
  }

  if (
    !user ||
    profile?.account_type
  ) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-5 py-10 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[460px] flex-col justify-center">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#5D5FEF]">
            LOOKUP
          </p>

          <h1 className="mt-4 text-[2.65rem] font-black italic leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-5xl">
            Bienvenido.
          </h1>

          <p className="mt-4 max-w-sm text-base leading-7 text-slate-500">
            ¿Qué tipo de cuenta quieres crear?
          </p>
        </header>

        <div className="mt-9 space-y-4">
          {ACCOUNT_OPTIONS.map(
            (option) => {
              const Icon =
                option.icon;

              const isSaving =
                savingType ===
                option.type;

              return (
                <button
                  key={option.type}
                  type="button"
                  disabled={
                    savingType !==
                    null
                  }
                  onClick={() =>
                    void handleSelect(
                      option.type,
                    )
                  }
                  className="
                    group
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-[28px]
                    border
                    border-[#E7E9F2]
                    bg-white
                    p-5
                    text-left
                    shadow-[0_12px_35px_rgba(15,23,42,0.05)]
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:border-[#5D5FEF]/30
                    hover:shadow-[0_18px_45px_rgba(93,95,239,0.10)]
                    active:translate-y-0
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-[20px]
                      bg-[#EEF2FF]
                      text-[#5D5FEF]
                    "
                  >
                    <Icon
                      size={25}
                      strokeWidth={
                        2.2
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-slate-900">
                      {option.title}
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {option.description}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-[#EEF2FF] group-hover:text-[#5D5FEF]">
                    {isSaving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#5D5FEF] border-t-transparent" />
                    ) : (
                      <ChevronRight
                        size={18}
                      />
                    )}
                  </div>
                </button>
              );
            },
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-600"
          >
            {error}
          </div>
        )}

        <p className="mx-auto mt-7 max-w-sm text-center text-xs leading-5 text-slate-400">
          Esta elección define la experiencia inicial de tu cuenta.
        </p>
      </section>
    </main>
  );
}