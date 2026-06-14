"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../components/auth-provider";
import { getMyProfile, type ProfileRow } from "@lookup/services";

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
    useState(false);
  const [profileError, setProfileError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    void getMyProfile(user.id)
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setProfile(null);
          setProfileError(error.message);
          return;
        }

        setProfile(data as ProfileRow | null);
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const isProfileComplete =
    Boolean(profile?.onboarding_completed);

  const needsOnboarding =
    Boolean(user) &&
    !authLoading &&
    !profileLoading &&
    !isProfileComplete;

  return {
    user,
    profile,
    authLoading,
    profileLoading,
    loading: authLoading || profileLoading,
    profileError,
    needsOnboarding,
    isProfileComplete,
  };
}