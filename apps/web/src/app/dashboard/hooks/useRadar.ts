"use client";

import { useEffect, useState } from "react";

import type {
  ProfileLink,
  ProfileRow,
} from "@lookup/services";

import { loadNearbyProfiles } from "../services/load-nearby-profiles";

type RadarState = {
  profiles: ProfileRow[];
  links: Record<string, ProfileLink[]>;
  loading: boolean;
  refresh(): Promise<void>;
};

export function useRadar(): RadarState {

  const [profiles, setProfiles] =
    useState<ProfileRow[]>([]);

  const [links, setLinks] =
    useState<
      Record<string, ProfileLink[]>
    >({});

  const [loading, setLoading] =
    useState(true);

  async function refresh() {

    try {

      setLoading(true);

      const result =
        await loadNearbyProfiles();

      setProfiles(result.profiles);

      setLinks(result.links);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    void refresh();

  }, []);

  return {

    profiles,

    links,

    loading,

    refresh,

  };

}