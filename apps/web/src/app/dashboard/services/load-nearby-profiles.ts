import {
  getProfileLinks,
  getProfilesNearby,
  type ProfileLink,
  type ProfileRow,
} from "@lookup/services";

export type NearbyProfilesResult = {
  profiles: ProfileRow[];
  links: Record<string, ProfileLink[]>;
};

export async function loadNearbyProfiles(
  latitude: number,
  longitude: number,
): Promise<NearbyProfilesResult> {
  const profiles = await getProfilesNearby(
    latitude,
    longitude,
    100,
  );

  const links: Record<string, ProfileLink[]> = {};

  await Promise.all(
    profiles.map(async (profile) => {
      links[profile.id] = await getProfileLinks(
        profile.id,
      );
    }),
  );

  return {
    profiles,
    links,
  };
}