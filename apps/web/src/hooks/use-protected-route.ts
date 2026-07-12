"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../components/auth-provider";
import { useProfileStatus } from "./use-profile-status";

export function useProtectedRoute() {
  const router = useRouter();

  const {
    user,
    authLoading,
    profileLoading,
    needsOnboarding,
  } = useProfileStatus();

  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (needsOnboarding) {
      router.replace("/onboarding");
      return;
    }
  }, [
    loading,
    user,
    needsOnboarding,
    router,
  ]);

  return {
    user,
    loading,
    needsOnboarding,
  };
}