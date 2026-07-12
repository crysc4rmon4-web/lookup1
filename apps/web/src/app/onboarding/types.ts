export type OnboardingStep =
  | "photo"
  | "username"
  | "name"
  | "socials"
  | "bio"
  | "interests"
  | "visibility";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "photo",
  "username",
  "name",
  "socials",
  "bio",
  "interests",
  "visibility",
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

  visibility: boolean;

  socialLinks: SocialLink[];
};