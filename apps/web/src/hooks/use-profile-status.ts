"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../components/auth-provider";
import {
  getMyProfile,
  type ProfileRow,
} from "@lookup/services";

type UseProfileStatusResult = {
  user: ReturnType<typeof useAuth>["user"];
  profile: ProfileRow | null;
  authLoading: boolean;
  profileLoading: boolean;
  loading: boolean;
  profileError: string | null;
  needsOnboarding: boolean;
  isProfileComplete: boolean;
};

export function useProfileStatus(): UseProfileStatusResult {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] =
    useState<ProfileRow | null>(null);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [profileError, setProfileError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        if (!active) return;

        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      const { data, error } = await getMyProfile(user.id);

      if (!active) return;

      if (error) {
        setProfile(null);
        setProfileError(error.message);
      } else {
        setProfile(data as ProfileRow | null);
      }

      setProfileLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const loading =
    authLoading || profileLoading;

  const isProfileComplete =
    profile?.onboarding_completed === true;

  /**
   * MUY IMPORTANTE
   *
   * Nunca decidir que necesita onboarding
   * mientras todavía estamos cargando el perfil.
   */
  const needsOnboarding =
    !loading &&
    !!user &&
    !!profile &&
    !isProfileComplete;

  return {
    user,
    profile,
    authLoading,
    profileLoading,
    loading,
    profileError,
    needsOnboarding,
    isProfileComplete,
  };
}