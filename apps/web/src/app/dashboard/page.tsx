"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createRadarBlockedZone,
  deleteRadarBlockedZone,
  getProfileLinks,
  getRadarBlockedZones,
  getRadarPresence,
  setRadarPresence,
  updateRadarBlockedZone,
  uploadAvatar,
  type ProfileLink,
  type ProfileRow,
  type RadarBlockedZone,
} from "@lookup/services";

import { BottomNav } from "../../components/bottom-nav";
import { useAuth } from "../../components/auth-provider";

import { useLocation } from "../../hooks/use-location";
import { useProfileStatus } from "../../hooks/use-profile-status";
import { useSyncLocation } from "../../hooks/use-sync-location";

import { useRadar } from "./hooks/useRadar";

import { DashboardHeader } from "./components/DashboardHeader";
import { RadarView } from "./components/RadarView";

import { EventsView, type EventCard } from "./components/EventsView";

import {
  SettingsView,
  type SettingsEditSection,
} from "./components/SettingsView";

import {
  SettingsProfileEditor,
  type SettingsProfileEditorData,
} from "./components/SettingsProfileEditor";

import {
  BlockedZoneForm,
  type BlockedZoneFormData,
} from "./components/BlockedZoneForm";

import { saveSettingsProfile } from "./services/save-settings-profile";

type Section = "radar" | "events" | "settings";

const MAX_BLOCKED_ZONES = 3;

export default function DashboardPage() {
  const router = useRouter();

  const { signOut } = useAuth();

  const { user, profile, loading, needsOnboarding } = useProfileStatus();

  /*
   * ============================================================
   * RADAR — ESTADO GENERAL
   * ============================================================
   */

  const [radarEnabled, setRadarEnabled] = useState(false);

  const [radarPresenceLoading, setRadarPresenceLoading] = useState(true);

  const [radarToggleLoading, setRadarToggleLoading] = useState(false);

  const [radarScanLoading, setRadarScanLoading] = useState(false);

  /*
   * El servidor es la autoridad para decidir
   * si una ubicación está protegida.
   */
  const [radarPrivacyBlocked, setRadarPrivacyBlocked] = useState(false);

  const radarRequested = radarEnabled && !radarPresenceLoading;

  /*
   * ============================================================
   * GEOLOCALIZACIÓN
   * ============================================================
   *
   * El GPS solo se solicita cuando Radar está activo.
   */

  const location = useLocation(radarRequested);

  /*
   * ============================================================
   * SINCRONIZACIÓN DE PRESENCIA
   * ============================================================
   */

  const locationSync = useSyncLocation({
    enabled: radarRequested,

    latitude: location.latitude,

    longitude: location.longitude,

    accuracy: location.accuracy,

    loading: location.loading,
  });

  /*
   * Nunca exponemos detalles internos de Supabase
   * o PostgreSQL al usuario.
   */

  const radarLocationError =
    location.error ??
    (locationSync.error
      ? "No pudimos sincronizar tu ubicación con el Radar."
      : null);

  const radarReady =
    radarRequested &&
    locationSync.ready &&
    !radarPrivacyBlocked &&
    radarLocationError === null;

  /*
   * ============================================================
   * DESCUBRIMIENTO
   * ============================================================
   */

  const { profiles, refresh } = useRadar({
    enabled: radarRequested,

    ready: radarReady,
  });

  /*
   * ============================================================
   * PERFIL / AJUSTES
   * ============================================================
   */

  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);

  const [settingsProfile, setSettingsProfile] = useState<ProfileRow | null>(
    null,
  );

  const [section, setSection] = useState<Section>("radar");

  const [settingsEditorSection, setSettingsEditorSection] =
    useState<SettingsEditSection | null>(null);

  const [settingsEditorSaving, setSettingsEditorSaving] = useState(false);

  /*
   * ============================================================
   * ZONAS PRIVADAS
   * ============================================================
   */

  const [blockedZones, setBlockedZones] = useState<RadarBlockedZone[]>([]);

  const [blockedZonesLoading, setBlockedZonesLoading] = useState(true);

  const [blockedZonesSaving, setBlockedZonesSaving] = useState(false);

  const [blockedZoneFormOpen, setBlockedZoneFormOpen] = useState(false);

  const [editingBlockedZone, setEditingBlockedZone] =
    useState<RadarBlockedZone | null>(null);

  /*
   * ============================================================
   * RECUPERAR PRESENCIA DEL RADAR
   * ============================================================
   */

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    let mounted = true;

    async function loadRadarPresence() {
      try {
        const enabled = await getRadarPresence();

        if (mounted) {
          setRadarEnabled(enabled);
        }
      } catch (error) {
        console.error("❌ Error cargando presencia del Radar", error);

        if (mounted) {
          setRadarEnabled(false);
        }
      } finally {
        if (mounted) {
          setRadarPresenceLoading(false);
        }
      }
    }

    void loadRadarPresence();

    return () => {
      mounted = false;
    };
  }, [loading, user]);

  /*
   * ============================================================
   * PROTECCIÓN DE ZONA PRIVADA
   * ============================================================
   *
   * sync_radar_location() devuelve false cuando:
   *
   * - la ubicación es válida;
   * - pero está dentro de una zona privada.
   *
   * La propia RPC deja is_active = false.
   */

  useEffect(() => {
    if (locationSync.radarAllowed === false) {
      setRadarPrivacyBlocked(true);

      if (radarEnabled) {
        setRadarEnabled(false);
      }

      return;
    }

    if (locationSync.radarAllowed === true) {
      setRadarPrivacyBlocked(false);
    }
  }, [locationSync.radarAllowed, radarEnabled]);

  /*
   * ============================================================
   * PROTECCIÓN DE RUTAS
   * ============================================================
   */

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");

      return;
    }

    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, user, needsOnboarding, router]);

  /*
   * ============================================================
   * PERFIL LOCAL
   * ============================================================
   */

  useEffect(() => {
    if (!profile) {
      return;
    }

    setSettingsProfile(profile);
  }, [profile]);

  /*
   * ============================================================
   * LINKS
   * ============================================================
   */

  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId = profile.id;

    let mounted = true;

    async function loadLinks() {
      try {
        const links = await getProfileLinks(profileId);

        if (mounted) {
          setProfileLinks(links ?? []);
        }
      } catch (error) {
        console.error("❌ Error cargando enlaces del perfil", error);

        if (mounted) {
          setProfileLinks([]);
        }
      }
    }

    void loadLinks();

    return () => {
      mounted = false;
    };
  }, [profile]);

  /*
   * ============================================================
   * CARGA DE ZONAS PRIVADAS
   * ============================================================
   */

  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId = profile.id;

    let mounted = true;

    async function loadBlockedZones() {
      setBlockedZonesLoading(true);

      try {
        const zones = await getRadarBlockedZones(profileId);

        if (mounted) {
          setBlockedZones(zones ?? []);
        }
      } catch (error) {
        console.error("❌ Error cargando zonas privadas", error);

        if (mounted) {
          setBlockedZones([]);
        }
      } finally {
        if (mounted) {
          setBlockedZonesLoading(false);
        }
      }
    }

    void loadBlockedZones();

    return () => {
      mounted = false;
    };
  }, [profile]);

  /*
   * ============================================================
   * EVENTOS
   * ============================================================
   *
   * Se implementará en su bloque dedicado.
   */

  const events: EventCard[] = [];

  /*
   * ============================================================
   * TOGGLE RADAR
   * ============================================================
   */

  const handleRadarToggle = async () => {
    if (radarToggleLoading || radarScanLoading || !user) {
      return;
    }

    const nextEnabled = !radarEnabled;

    setRadarToggleLoading(true);

    try {
      /*
       * ACTIVAR
       *
       * No utilizamos setRadarPresence(true).
       *
       * La única operación autorizada para activar
       * presencia es sync_radar_location(), que exige
       * una ubicación válida y comprueba privacidad.
       */

      if (nextEnabled) {
        setRadarPrivacyBlocked(false);

        setRadarEnabled(true);

        return;
      }

      /*
       * DESACTIVAR
       */

      await setRadarPresence(false);

      setRadarEnabled(false);

      setRadarPrivacyBlocked(false);
    } catch (error) {
      console.error("❌ Error cambiando presencia del Radar", error);
    } finally {
      setRadarToggleLoading(false);
    }
  };

  /*
   * ============================================================
   * ESCANEAR AHORA
   * ============================================================
   *
   * A diferencia del refresco automático:
   *
   * 1. sincroniza nuestra ubicación/presencia;
   * 2. el servidor vuelve a comprobar zonas privadas;
   * 3. solo si seguimos siendo visibles,
   *    consulta candidatos ≤25 m.
   */

  const handleRadarRefresh = async () => {
    if (
      radarScanLoading ||
      radarToggleLoading ||
      !radarRequested ||
      !radarReady
    ) {
      return;
    }

    setRadarScanLoading(true);

    try {
      const radarAllowed = await locationSync.syncNow();

      /*
       * Si hemos entrado en una zona privada,
       * sync_radar_location() ya ha desactivado
       * nuestra presencia.
       *
       * No consultamos candidatos.
       */

      if (!radarAllowed) {
        return;
      }

      await refresh();
    } catch (error) {
      console.error("❌ Error escaneando conexiones cercanas", error);
    } finally {
      setRadarScanLoading(false);
    }
  };

  /*
   * ============================================================
   * EDITOR PERFIL — ABRIR
   * ============================================================
   */

  const handleEditProfile = (editSection: SettingsEditSection = "profile") => {
    setSettingsEditorSection(editSection);
  };

  /*
   * ============================================================
   * EDITOR PERFIL — CERRAR
   * ============================================================
   */

  const handleCloseProfileEditor = () => {
    if (settingsEditorSaving) {
      return;
    }

    setSettingsEditorSection(null);
  };

  /*
   * ============================================================
   * EDITOR PERFIL — GUARDAR
   * ============================================================
   */

  const handleSaveProfile = async (data: SettingsProfileEditorData) => {
    if (!user || !settingsProfile) {
      return;
    }

    setSettingsEditorSaving(true);

    try {
      let avatarUrl = settingsProfile.avatar_url ?? "";

      if (data.avatarFile) {
        avatarUrl = await uploadAvatar(user.id, data.avatarFile);
      }

      const result = await saveSettingsProfile({
        userId: user.id,

        email: user.email ?? "",

        profile: settingsProfile,

        data,

        avatarUrl,
      });

      if (result.profile) {
        setSettingsProfile(result.profile);
      }

      const updatedLinks = await getProfileLinks(user.id);

      setProfileLinks(updatedLinks ?? []);

      setSettingsEditorSection(null);
    } catch (error) {
      console.error("❌ Error guardando edición de perfil", error);

      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert("No se pudieron guardar los cambios.");
      }
    } finally {
      setSettingsEditorSaving(false);
    }
  };

  /*
   * ============================================================
   * ZONAS PRIVADAS — CREAR
   * ============================================================
   */

  const handleAddBlockedZone = () => {
    if (blockedZones.length >= MAX_BLOCKED_ZONES) {
      return;
    }

    setEditingBlockedZone(null);

    setBlockedZoneFormOpen(true);
  };

  /*
   * ============================================================
   * ZONAS PRIVADAS — EDITAR
   * ============================================================
   */

  const handleEditBlockedZone = (zone: RadarBlockedZone) => {
    setEditingBlockedZone(zone);

    setBlockedZoneFormOpen(true);
  };

  /*
   * ============================================================
   * ZONAS PRIVADAS — CERRAR
   * ============================================================
   */

  const handleCloseBlockedZoneForm = () => {
    if (blockedZonesSaving) {
      return;
    }

    setBlockedZoneFormOpen(false);

    setEditingBlockedZone(null);
  };

  /*
   * ============================================================
   * ZONAS PRIVADAS — GUARDAR
   * ============================================================
   */

  const handleSaveBlockedZone = async (data: BlockedZoneFormData) => {
    if (!profile) {
      return;
    }

    setBlockedZonesSaving(true);

    try {
      if (editingBlockedZone) {
        const updated = await updateRadarBlockedZone(editingBlockedZone.id, {
          name: data.name,

          address: data.address,

          latitude: data.latitude,

          longitude: data.longitude,

          radius_meters: data.radiusMeters,
        });

        setBlockedZones((current) =>
          current.map((zone) => (zone.id === updated.id ? updated : zone)),
        );
      } else {
        if (blockedZones.length >= MAX_BLOCKED_ZONES) {
          throw new Error(
            `Solo puedes tener ${MAX_BLOCKED_ZONES} zonas privadas.`,
          );
        }

        const created = await createRadarBlockedZone({
          profile_id: profile.id,

          name: data.name,

          address: data.address,

          latitude: data.latitude,

          longitude: data.longitude,

          radius_meters: data.radiusMeters,
        });

        setBlockedZones((current) => [...current, created]);
      }

      setBlockedZoneFormOpen(false);

      setEditingBlockedZone(null);
    } catch (error) {
      console.error("❌ Error guardando zona privada", error);

      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert("No se pudo guardar la zona privada.");
      }
    } finally {
      setBlockedZonesSaving(false);
    }
  };

  /*
   * ============================================================
   * ZONAS PRIVADAS — ELIMINAR
   * ============================================================
   */

  const handleDeleteBlockedZone = async (zone: RadarBlockedZone) => {
    const confirmed = window.confirm(
      `¿Quieres eliminar la zona "${zone.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setBlockedZonesSaving(true);

    try {
      await deleteRadarBlockedZone(zone.id);

      setBlockedZones((current) =>
        current.filter((item) => item.id !== zone.id),
      );
    } catch (error) {
      console.error("❌ Error eliminando zona privada", error);

      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert("No se pudo eliminar la zona privada.");
      }
    } finally {
      setBlockedZonesSaving(false);
    }
  };

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    try {
      await setRadarPresence(false);

      setRadarEnabled(false);

      setRadarPrivacyBlocked(false);
    } catch (error) {
      console.error("❌ Error apagando Radar antes de cerrar sesión", error);
    }

    await signOut();

    router.replace("/login");
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading || radarPresenceLoading || !user) {
    return null;
  }

  if (!profile || !settingsProfile) {
    return null;
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4 sm:px-6">
        <DashboardHeader section={section} />

        {section === "radar" && (
          <RadarView
            enabled={radarRequested}
            radarReady={radarReady}
            privacyBlocked={radarPrivacyBlocked}
            toggleLoading={radarToggleLoading}
            scanLoading={radarScanLoading}
            locationLoading={location.loading}
            locationSyncing={locationSync.syncing}
            locationError={radarLocationError}
            accuracy={location.accuracy}
            onToggle={handleRadarToggle}
            onRefresh={handleRadarRefresh}
            profiles={profiles}
          />
        )}

        {section === "events" && (
          <EventsView
            events={events}
            onCreateEvent={() => console.log("Crear evento")}
            onJoinEvent={(id) => console.log("Unirse", id)}
          />
        )}

        {section === "settings" && (
          <SettingsView
            profile={settingsProfile}
            links={profileLinks}
            radarEnabled={radarEnabled}
            radarToggleLoading={radarToggleLoading}
            onToggleRadar={handleRadarToggle}
            blockedZones={blockedZones}
            blockedZonesLoading={blockedZonesLoading}
            blockedZonesSaving={blockedZonesSaving}
            canAddBlockedZone={blockedZones.length < MAX_BLOCKED_ZONES}
            maxBlockedZones={MAX_BLOCKED_ZONES}
            onAddBlockedZone={handleAddBlockedZone}
            onEditBlockedZone={handleEditBlockedZone}
            onDeleteBlockedZone={handleDeleteBlockedZone}
            onEditProfile={handleEditProfile}
            onLogout={handleLogout}
          />
        )}

        <BottomNav
          active={section}
          onChange={(nextSection) => setSection(nextSection as Section)}
        />
      </div>

      {settingsEditorSection && (
        <SettingsProfileEditor
          profile={settingsProfile}
          links={profileLinks}
          section={settingsEditorSection}
          saving={settingsEditorSaving}
          onSave={handleSaveProfile}
          onClose={handleCloseProfileEditor}
        />
      )}

      {blockedZoneFormOpen && (
        <BlockedZoneForm
          zone={editingBlockedZone}
          saving={blockedZonesSaving}
          onSubmit={handleSaveBlockedZone}
          onCancel={handleCloseBlockedZoneForm}
        />
      )}
    </main>
  );
}