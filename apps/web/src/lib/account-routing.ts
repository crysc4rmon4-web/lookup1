import type {
    AccountType,
    ProfileRow,
} from "@lookup/services";

export type OnboardingRoute =
    | "/onboarding"
    | "/onboarding/business";

export type AuthenticatedDestination =
    | "/account-type"
    | OnboardingRoute
    | "/dashboard";

type RoutableProfile = Pick<
    ProfileRow,
    | "account_type"
    | "onboarding_completed"
>;

export function getOnboardingRoute(
    accountType: AccountType,
): OnboardingRoute {
    return accountType === "business"
        ? "/onboarding/business"
        : "/onboarding";
}

export function getAuthenticatedDestination(
    profile: RoutableProfile | null,
): AuthenticatedDestination {
    if (!profile?.account_type) {
        return "/account-type";
    }

    if (!profile.onboarding_completed) {
        return getOnboardingRoute(
            profile.account_type,
        );
    }

    return "/dashboard";
}