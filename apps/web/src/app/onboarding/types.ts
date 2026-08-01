export type OnboardingStep =
  | "photo"
  | "name"
  | "socials"
  | "bio"
  | "interests"
  | "review"
  | "terms";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "photo",
  "name",
  "socials",
  "bio",
  "interests",
  "review",
  "terms"
];

export type SocialLink = {
  platform: string;
  url: string;
};

export type OnboardingData = {
  avatarUrl: string;

  username: string;

  fullName: string;

  bio: string;

  interests: string[];

  acceptedTerms: boolean;

  socialLinks: SocialLink[];
};