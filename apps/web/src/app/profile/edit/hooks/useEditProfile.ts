"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../components/auth-provider";
import type { OnboardingData } from "../../../onboarding/types";
import { loadProfile } from "../services/load-profile";


export function useEditProfile() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    async function load() {
      try {
        const profile = await loadProfile(userId);

        setData(profile);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  return {
    loading,
    data,
  };
}