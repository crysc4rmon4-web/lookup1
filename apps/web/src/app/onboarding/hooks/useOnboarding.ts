"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../../components/auth-provider";

import {
  ONBOARDING_STEPS,
  type OnboardingData,
} from "../types";

const DRAFT_VERSION = 1;

const DRAFT_STORAGE_PREFIX =
  "lookup:person-onboarding-draft";

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

type StoredOnboardingDraft = {
  version: number;
  stepIndex: number;
  data: Partial<OnboardingData>;
};

type UseOnboardingOptions = {
  initialData?: Partial<OnboardingData>;

  /**
   * Solo el onboarding inicial debe
   * persistir un borrador.
   *
   * Las pantallas de edición de perfil
   * no activan esta opción.
   */
  persistDraft?: boolean;
};

function getDraftStorageKey(
  userId: string,
) {
  return `${DRAFT_STORAGE_PREFIX}:${userId}`;
}

function clampStepIndex(
  value: number,
) {
  return Math.min(
    Math.max(value, 0),
    ONBOARDING_STEPS.length - 1,
  );
}

function restoreDraftData(
  value: Partial<OnboardingData>,
): OnboardingData {
  return {
    ...INITIAL_DATA,
    ...value,

    interests: Array.isArray(
      value.interests,
    )
      ? value.interests
      : [],

    socialLinks: Array.isArray(
      value.socialLinks,
    )
      ? value.socialLinks
      : [],

    acceptedTerms:
      value.acceptedTerms === true,
  };
}

export function useOnboarding(
  options?: UseOnboardingOptions,
) {
  const { user } = useAuth();

  const shouldPersistDraft =
    options?.persistDraft === true;

  const [
    stepIndex,
    setStepIndex,
  ] = useState(0);

  const [
    data,
    setData,
  ] = useState<OnboardingData>({
    ...INITIAL_DATA,
    ...options?.initialData,
  });

  const [
    draftReady,
    setDraftReady,
  ] = useState(
    !shouldPersistDraft,
  );

  const draftStorageKey =
    shouldPersistDraft &&
    user?.id
      ? getDraftStorageKey(
          user.id,
        )
      : null;

  /**
   * Mantiene el comportamiento existente
   * para las pantallas que utilizan
   * initialData, por ejemplo edición.
   */
  useEffect(() => {
    if (
      !options?.initialData
    ) {
      return;
    }

    setData({
      ...INITIAL_DATA,
      ...options.initialData,
    });
  }, [
    options?.initialData,
  ]);

  /**
   * Recupera el onboarding exclusivamente
   * para el usuario autenticado.
   *
   * Cada cuenta tiene su propia clave,
   * por lo que dos usuarios no pueden
   * compartir accidentalmente un borrador.
   */
  useEffect(() => {
    if (
      !shouldPersistDraft
    ) {
      setDraftReady(true);
      return;
    }

    if (
      !draftStorageKey
    ) {
      setDraftReady(false);
      return;
    }

    setDraftReady(false);

    try {
      const raw =
        window.localStorage.getItem(
          draftStorageKey,
        );

      if (!raw) {
        setStepIndex(0);

        setData({
          ...INITIAL_DATA,
        });

        setDraftReady(true);
        return;
      }

      const parsed =
        JSON.parse(
          raw,
        ) as StoredOnboardingDraft;

      if (
        parsed.version !==
          DRAFT_VERSION ||
        typeof parsed.stepIndex !==
          "number" ||
        !parsed.data ||
        typeof parsed.data !==
          "object"
      ) {
        window.localStorage.removeItem(
          draftStorageKey,
        );

        setStepIndex(0);

        setData({
          ...INITIAL_DATA,
        });

        setDraftReady(true);
        return;
      }

      setStepIndex(
        clampStepIndex(
          parsed.stepIndex,
        ),
      );

      setData(
        restoreDraftData(
          parsed.data,
        ),
      );
    } catch {
      window.localStorage.removeItem(
        draftStorageKey,
      );

      setStepIndex(0);

      setData({
        ...INITIAL_DATA,
      });
    } finally {
      setDraftReady(true);
    }
  }, [
    draftStorageKey,
    shouldPersistDraft,
  ]);

  /**
   * Guarda automáticamente cada cambio
   * y cada avance de paso una vez que
   * el borrador inicial ha sido cargado.
   */
  useEffect(() => {
    if (
      !shouldPersistDraft ||
      !draftReady ||
      !draftStorageKey
    ) {
      return;
    }

    const draft:
      StoredOnboardingDraft = {
        version:
          DRAFT_VERSION,

        stepIndex,

        data,
      };

    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify(
        draft,
      ),
    );
  }, [
    data,
    draftReady,
    draftStorageKey,
    shouldPersistDraft,
    stepIndex,
  ]);

  function update(
    values: Partial<OnboardingData>,
  ) {
    setData(
      (current) => ({
        ...current,
        ...values,
      }),
    );
  }

  const canContinue =
    useMemo(() => {
      const step =
        ONBOARDING_STEPS[
          stepIndex
        ];

      switch (step) {
        case "photo":
          return true;

        case "name":
          return (
            data.fullName
              .trim()
              .length >= 2
          );

        case "profession":
          return true;

        case "bio":
          return true;

        case "interests":
          return true;

        case "terms":
          return (
            data.acceptedTerms
          );

        default:
          return true;
      }
    }, [
      data,
      stepIndex,
    ]);

  function next() {
    if (!canContinue) {
      return;
    }

    setStepIndex(
      (current) =>
        Math.min(
          current + 1,
          ONBOARDING_STEPS.length -
            1,
        ),
    );
  }

  function previous() {
    setStepIndex(
      (current) =>
        Math.max(
          current - 1,
          0,
        ),
    );
  }

  function clearDraft() {
    if (
      !draftStorageKey
    ) {
      return;
    }

    window.localStorage.removeItem(
      draftStorageKey,
    );
  }

  return {
    stepIndex,

    step:
      ONBOARDING_STEPS[
        stepIndex
      ]!,

    totalSteps:
      ONBOARDING_STEPS.length,

    progress:
      ((stepIndex + 1) /
        ONBOARDING_STEPS.length) *
      100,

    data,

    update,
    next,
    previous,

    canContinue,

    draftReady,
    clearDraft,
  };
}