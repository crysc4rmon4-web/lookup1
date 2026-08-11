"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getMyProfile,
  type AccountType,
  type ProfileRow,
} from "@lookup/services";

import { useAuth } from "../components/auth-provider";

import {
  getAuthenticatedDestination,
  getOnboardingRoute,
  type AuthenticatedDestination,
} from "../lib/account-routing";

type UseProfileStatusResult = {
  user: ReturnType<
    typeof useAuth
  >["user"];

  profile: ProfileRow | null;

  accountType: AccountType | null;

  authLoading: boolean;
  profileLoading: boolean;
  loading: boolean;

  profileError: string | null;

  needsAccountType: boolean;
  needsOnboarding: boolean;
  isProfileComplete: boolean;

  onboardingRoute:
    | "/onboarding"
    | "/onboarding/business"
    | null;

  authenticatedDestination:
    AuthenticatedDestination;
};

export function useProfileStatus():
  UseProfileStatusResult {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileRow | null>(
      null,
    );

  const [
    profileLoading,
    setProfileLoading,
  ] =
    useState(true);

  const [
    profileError,
    setProfileError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      /*
       * Mientras Auth todavía está
       * resolviendo la sesión no debemos
       * decidir nada sobre el perfil.
       */
      if (authLoading) {
        return;
      }

      if (!user) {
        if (!active) {
          return;
        }

        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);

        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      try {
        const {
          data,
          error,
        } =
          await getMyProfile(
            user.id,
          );

        if (!active) {
          return;
        }

        if (error) {
          setProfile(null);
          setProfileError(
            error.message,
          );

          return;
        }

        setProfile(
          data as ProfileRow | null,
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setProfile(null);

        setProfileError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el perfil.",
        );
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [
    authLoading,
    user,
  ]);

  const loading =
    authLoading ||
    profileLoading;

  const accountType =
    profile?.account_type ??
    null;

  const isProfileComplete =
    profile
      ?.onboarding_completed ===
    true;

  /*
   * Una cuenta nueva puede estar
   * autenticada pero todavía no tener
   * fila en profiles.
   *
   * Ese caso significa que debe elegir
   * su tipo de cuenta.
   */
  const needsAccountType =
    !loading &&
    Boolean(user) &&
    (!profile || !accountType);

  const needsOnboarding =
    !loading &&
    Boolean(user) &&
    Boolean(profile) &&
    Boolean(accountType) &&
    !isProfileComplete;

  const onboardingRoute =
    accountType
      ? getOnboardingRoute(
          accountType,
        )
      : null;

  const authenticatedDestination =
    getAuthenticatedDestination(
      profile,
    );

  return {
    user,
    profile,
    accountType,

    authLoading,
    profileLoading,
    loading,

    profileError,

    needsAccountType,
    needsOnboarding,
    isProfileComplete,

    onboardingRoute,
    authenticatedDestination,
  };
}