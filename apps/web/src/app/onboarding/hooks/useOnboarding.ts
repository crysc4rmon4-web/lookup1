"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ONBOARDING_STEPS,
  type OnboardingData,
} from "../types";

const INITIAL_DATA: OnboardingData = {
  avatarUrl: "",
  username: "",
  fullName: "",
  profession: "",
  bio: "",
  interests: [],
  acceptedTerms: false,
  socialLinks: [],
};

type UseOnboardingOptions = {
  initialData?: Partial<OnboardingData>;
};

export function useOnboarding(
  options?: UseOnboardingOptions,
) {
  const [stepIndex, setStepIndex] = useState(0);

  const [data, setData] =
    useState<OnboardingData>({
      ...INITIAL_DATA,
      ...options?.initialData,
    });

  useEffect(() => {
    if (!options?.initialData) return;

    setData({
      ...INITIAL_DATA,
      ...options.initialData,
    });
  }, [options?.initialData]);

  function update(
    values: Partial<OnboardingData>,
  ) {
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

      case "name":
        return data.fullName.trim().length >= 2;

      case "profession":
        return true;

      case "bio":
        return true;

      case "interests":
        return true;

      case "terms":
        return data.acceptedTerms;



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
    step: ONBOARDING_STEPS[stepIndex]!,
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