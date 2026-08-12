"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createRadarBlockedZone,
  deleteRadarBlockedZone,
  getRadarBlockedZones,
  updateRadarBlockedZone,
  type CreateRadarBlockedZoneInput,
  type RadarBlockedZone,
  type UpdateRadarBlockedZoneInput,
} from "@lookup/services";

import { useAuth } from "../components/auth-provider";

const MAX_BLOCKED_ZONES = 3;

export function useRadarBlockedZones() {
  const { user } = useAuth();

  const [zones, setZones] = useState<RadarBlockedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadZones = useCallback(async () => {
    if (!user) {
      setZones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getRadarBlockedZones(user.id);

      setZones(data);
    } catch (err) {
      console.error("❌ Error cargando zonas bloqueadas del radar", err);

      setZones([]);
      setError("No se pudieron cargar las zonas bloqueadas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const addZone = useCallback(
    async (input: Omit<CreateRadarBlockedZoneInput, "profile_id">) => {
      if (!user) {
        throw new Error("Usuario no autenticado.");
      }

      if (zones.length >= MAX_BLOCKED_ZONES) {
        throw new Error("Puedes configurar un máximo de 3 zonas bloqueadas.");
      }

      setSaving(true);
      setError(null);

      try {
        const zone = await createRadarBlockedZone({
          ...input,
          profile_id: user.id,
        });

        setZones((current) => [...current, zone]);

        return zone;
      } catch (err) {
        console.error("❌ Error creando zona bloqueada", err);

        const message =
          err instanceof Error
            ? err.message
            : "No se pudo crear la zona bloqueada.";

        setError(message);

        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [user, zones.length],
  );

  const updateZone = useCallback(
    async (zoneId: string, input: UpdateRadarBlockedZoneInput) => {
      setSaving(true);
      setError(null);

      try {
        const updatedZone = await updateRadarBlockedZone(zoneId, input);

        setZones((current) =>
          current.map((zone) => (zone.id === zoneId ? updatedZone : zone)),
        );

        return updatedZone;
      } catch (err) {
        console.error("❌ Error actualizando zona bloqueada", err);

        const message =
          err instanceof Error
            ? err.message
            : "No se pudo actualizar la zona bloqueada.";

        setError(message);

        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const removeZone = useCallback(async (zoneId: string) => {
    setSaving(true);
    setError(null);

    try {
      await deleteRadarBlockedZone(zoneId);

      setZones((current) => current.filter((zone) => zone.id !== zoneId));
    } catch (err) {
      console.error("❌ Error eliminando zona bloqueada", err);

      const message =
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la zona bloqueada.";

      setError(message);

      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const canAddZone = zones.length < MAX_BLOCKED_ZONES;

  return {
    zones,
    loading,
    saving,
    error,
    canAddZone,
    maxZones: MAX_BLOCKED_ZONES,
    loadZones,
    addZone,
    updateZone,
    removeZone,
  };
}
