"use client";

import { useEffect, useMemo, useState } from "react";

import { isValidEmail } from "@lookup/utils";

import { useAuth } from "@/components/auth-provider";

import {
  BUSINESS_ONBOARDING_STEPS,
  type BusinessOnboardingData,
} from "../types";

const DRAFT_VERSION = 1;

const DRAFT_STORAGE_PREFIX = "lookup:business-onboarding-draft";

const INITIAL_DATA: BusinessOnboardingData = {
  legalName: "",
  tradeName: "",
  taxId: "",
  sector: "",

  address: "",
  city: "",
  province: "",
  postalCode: "",

  contactEmail: "",
  contactPhone: "",
  website: "",

  socialLinks: [],

  acceptedTerms: false,
};

type StoredBusinessDraft = {
  version: number;
  stepIndex: number;
  data: Partial<BusinessOnboardingData>;
};

function getDraftStorageKey(userId: string) {
  return `${DRAFT_STORAGE_PREFIX}:${userId}`;
}

function clampStepIndex(value: number) {
  return Math.min(Math.max(value, 0), BUSINESS_ONBOARDING_STEPS.length - 1);
}

function restoreDraftData(
  value: Partial<BusinessOnboardingData>,
): BusinessOnboardingData {
  return {
    ...INITIAL_DATA,
    ...value,

    socialLinks: Array.isArray(value.socialLinks) ? value.socialLinks : [],

    acceptedTerms: value.acceptedTerms === true,
  };
}

export function useBusinessOnboarding() {
  const { user } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);

  const [data, setData] = useState<BusinessOnboardingData>(INITIAL_DATA);

  const [draftReady, setDraftReady] = useState(false);

  const draftStorageKey = user?.id ? getDraftStorageKey(user.id) : null;

  /*
   * Recuperamos el borrador específico
   * del usuario autenticado.
   */
  useEffect(() => {
    if (!draftStorageKey) {
      setDraftReady(false);
      return;
    }

    setDraftReady(false);

    try {
      const raw = window.localStorage.getItem(draftStorageKey);

      if (!raw) {
        setData(INITIAL_DATA);

        setStepIndex(0);
        setDraftReady(true);

        return;
      }

      const parsed = JSON.parse(raw) as StoredBusinessDraft;

      if (
        parsed.version !== DRAFT_VERSION ||
        typeof parsed.stepIndex !== "number" ||
        !parsed.data ||
        typeof parsed.data !== "object"
      ) {
        window.localStorage.removeItem(draftStorageKey);

        setData(INITIAL_DATA);

        setStepIndex(0);
        setDraftReady(true);

        return;
      }

      setData(restoreDraftData(parsed.data));

      setStepIndex(clampStepIndex(parsed.stepIndex));
    } catch {
      window.localStorage.removeItem(draftStorageKey);

      setData(INITIAL_DATA);

      setStepIndex(0);
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey]);

  /*
   * Cada modificación queda guardada
   * localmente. Una recarga de página
   * no destruye el onboarding.
   */
  useEffect(() => {
    if (!draftReady || !draftStorageKey) {
      return;
    }

    const draft: StoredBusinessDraft = {
      version: DRAFT_VERSION,

      stepIndex,

      data,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [data, draftReady, draftStorageKey, stepIndex]);

  function update(values: Partial<BusinessOnboardingData>) {
    setData((current) => ({
      ...current,
      ...values,
    }));
  }

  const canContinue = useMemo(() => {
    const step = BUSINESS_ONBOARDING_STEPS[stepIndex];

    switch (step) {
      case "details":
        return (
          data.legalName.trim().length >= 2 &&
          data.tradeName.trim().length >= 2 &&
          data.taxId.trim().length >= 5 &&
          data.sector.trim().length >= 2
        );

      case "location":
        return (
          data.address.trim().length >= 3 &&
          data.city.trim().length >= 2 &&
          data.province.trim().length >= 2 &&
          data.postalCode.trim().length >= 3
        );

      case "contact":
        return isValidEmail(data.contactEmail.trim());

      case "socials":
        return true;

      case "review":
        return true;

      case "terms":
        return data.acceptedTerms;

      default:
        return false;
    }
  }, [data, stepIndex]);

  function next() {
    if (!canContinue) {
      return;
    }

    setStepIndex((current) =>
      Math.min(current + 1, BUSINESS_ONBOARDING_STEPS.length - 1),
    );
  }

  function previous() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function clearDraft() {
    if (draftStorageKey) {
      window.localStorage.removeItem(draftStorageKey);
    }
  }

  return {
    step: BUSINESS_ONBOARDING_STEPS[stepIndex]!,

    stepIndex,

    totalSteps: BUSINESS_ONBOARDING_STEPS.length,

    progress: ((stepIndex + 1) / BUSINESS_ONBOARDING_STEPS.length) * 100,

    data,

    update,
    next,
    previous,

    canContinue,

    draftReady,
    clearDraft,
  };
}
