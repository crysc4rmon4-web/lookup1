"use client";

import { useState } from "react";

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

  function next() {
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

  function update(
    values: Partial<OnboardingData>,
  ) {
    setData((current) => ({
      ...current,
      ...values,
    }));
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
  };
}