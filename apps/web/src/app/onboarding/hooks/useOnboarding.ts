"use client";

import { useMemo, useState } from "react";
import {
  ONBOARDING_STEPS,
  type OnboardingData,
} from "../types";

const INITIAL_DATA: OnboardingData = {
  avatarUrl: "",
  username: "",
  fullName: "",
  bio: "",
  interests: [],
  visibility: true,
  socialLinks: [],
};

export function useOnboarding() {
  const [stepIndex, setStepIndex] = useState(0);

  const [data, setData] =
    useState<OnboardingData>(INITIAL_DATA);

  function update(values: Partial<OnboardingData>) {
    setData((current) => ({
      ...current,
      ...values,
    }));
  }

  const canContinue = useMemo(() => {
    const step = ONBOARDING_STEPS[stepIndex];

    switch (step) {
      case "photo":
        return true;

      case "username":
        return data.username.trim().length >= 3;

      case "name":
        return data.fullName.trim().length >= 3;

      case "bio":
        return data.bio.trim().length >= 10;

      case "interests":
        return data.interests.length > 0;

      default:
        return true;
    }
  }, [data, stepIndex]);

  function next() {
    if (!canContinue) return;

    setStepIndex((current) =>
      Math.min(
        current + 1,
        ONBOARDING_STEPS.length - 1,
      ),
    );
  }

  function previous() {
    setStepIndex((current) =>
      Math.max(current - 1, 0),
    );
  }

  return {
    stepIndex,
    step: ONBOARDING_STEPS[stepIndex],
    totalSteps: ONBOARDING_STEPS.length,
    progress:
      ((stepIndex + 1) /
        ONBOARDING_STEPS.length) *
      100,
    data,
    update,
    next,
    previous,
    canContinue,
  };
}