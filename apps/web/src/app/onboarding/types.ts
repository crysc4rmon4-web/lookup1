export type OnboardingStep =
  | "photo"
  | "name"
  | "profession"
  | "socials"
  | "bio"
  | "interests"
  | "review"
  | "terms";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "photo",
  "name",
  "profession",
  "socials",
  "bio",
  "interests",
  "review",
  "terms",
];

export type SocialLink = {
  platform: string;
  url: string;
};

export type OnboardingData = {
  avatarUrl: string;

  username: string;

  fullName: string;

  profession: string;

  bio: string;

  interests: string[];

  acceptedTerms: boolean;

  socialLinks: SocialLink[];
};
