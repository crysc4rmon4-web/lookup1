import { useEffect, useState } from "react";

import { useAuth } from "../../../../components/auth-provider";

import { loadProfile } from "../services/load-profile";
import { saveProfile } from "../../../onboarding/services/save-profile";

import type { OnboardingData } from "../../../onboarding/types";

export function useEditProfile() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    let cancelled = false;

    async function fetchProfile() {
      try {
        const profile = await loadProfile(userId);

        if (!cancelled) {
          setData(profile);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function save(data: OnboardingData) {
    if (!user) {
      throw new Error("Usuario no autenticado.");
    }

    if (!user.email) {
      throw new Error("El usuario no tiene email.");
    }

    await saveProfile({
      userId: user.id,
      email: user.email,
      data,
      completeOnboarding: false,
    });
  }

  return {
    loading,
    data,
    save,
  };
}
