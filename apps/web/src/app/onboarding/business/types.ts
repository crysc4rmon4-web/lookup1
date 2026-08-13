import type { SocialLink } from "../types";

export type BusinessOnboardingStep =
  | "details"
  | "photo"
  | "location"
  | "contact"
  | "socials"
  | "review"
  | "terms";

export const BUSINESS_ONBOARDING_STEPS: BusinessOnboardingStep[] = [
  "details",
  "photo",
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
  bio: string;

  avatarUrl: string;

  address: string;
  city: string;
  province: string;
  postalCode: string;

  latitude: number | null;
  longitude: number | null;
  verifiedAddress: string;

  contactEmail: string;
  contactPhone: string;
  website: string;

  socialLinks: SocialLink[];

  acceptedTerms: boolean;
};