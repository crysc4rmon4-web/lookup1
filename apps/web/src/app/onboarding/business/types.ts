import type { SocialLink } from "../types";

export type BusinessOnboardingStep =
  "details" | "location" | "contact" | "socials" | "review" | "terms";

export const BUSINESS_ONBOARDING_STEPS: BusinessOnboardingStep[] = [
  "details",
  "location",
  "contact",
  "socials",
  "review",
  "terms",
];

export type BusinessOnboardingData = {
  legalName: string;
  tradeName: string;
  taxId: string;
  sector: string;

  address: string;
  city: string;
  province: string;
  postalCode: string;

  contactEmail: string;
  contactPhone: string;
  website: string;

  socialLinks: SocialLink[];

  acceptedTerms: boolean;
};
