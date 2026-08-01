export type OnboardingStep =
  | "photo"
  | "username"
  | "socials"
  | "bio"
  | "interests"
  | "review"
  | "terms"
  | "welcome";;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "photo",
  "username",
  "socials",
  "bio",
  "interests",
  "review",
  "terms",
  "welcome"
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