"use client";

import {
  getVisibleProfiles,
  getProfileLinks,
  type ProfileLink,
  type ProfileRow,
} from "@lookup/services";

import { getCurrentLocation } from "../../../services/location/get-current-location";

type Result = {
  profiles: ProfileRow[];
  links: Record<string, ProfileLink[]>;
};

export async function loadNearbyProfiles(): Promise<Result> {

  const location =
    await getCurrentLocation();

  if (!location) {

    return {
      profiles: [],
      links: {},
    };

  }

  const response =
    await getVisibleProfiles();

  const profiles =
    response.data ?? [];

  const links: Record<
    string,
    ProfileLink[]
  > = {};

  await Promise.all(

    profiles.map(
      async (profile) => {

        const result =
          await getProfileLinks(
            profile.id,
          );

        links[profile.id] =
          result ?? [];

      },
    ),

  );

  return {

    profiles,

    links,

  };

}