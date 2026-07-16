"use client";

import { useEffect, useState } from "react";

import type {
  ProfileLink,
  ProfileRow,
} from "@lookup/services";

import { useLocation } from "../../../hooks/use-location";
import { loadNearbyProfiles } from "../services/load-nearby-profiles";

export function useRadar() {
  const {
    latitude,
    longitude,
    loading,
  } = useLocation();

  const [profiles, setProfiles] = useState<
    ProfileRow[]
  >([]);

  const [links, setLinks] = useState<
    Record<string, ProfileLink[]>
  >({});

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    if (
      loading ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    const lat = latitude;
    const lon = longitude;

    let mounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const result =
          await loadNearbyProfiles(
            lat,
            lon,
          );

        if (!mounted) return;

        setProfiles(result.profiles);
        setLinks(result.links);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [
    latitude,
    longitude,
    loading,
  ]);

  return {
    profiles,
    links,
    profilesLoading: isLoading,
  };
}