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
   * ÚNICA instancia de geolocalización.
   *
   * Toda la aplicación comparte esta ubicación.
   */
  const location = useLocation();

  /*
   * Estado local del radar.
   *
   * Arranca OFF por seguridad.
   * Después recuperamos el estado real desde Supabase.
   */
  const [radarEnabled, setRadarEnabled] = useState(false);

  const [radarPresenceLoading, setRadarPresenceLoading] = useState(true);

  /*
   * Evita múltiples cambios simultáneos
   * del toggle mientras Supabase responde.
   */
  const [radarToggleLoading, setRadarToggleLoading] = useState(false);

  /*
   * Enlaces del perfil.
   */
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);

  /*
   * Perfil local para que Ajustes pueda
   * actualizarse inmediatamente después
   * de guardar.
   */
  const [settingsProfile, setSettingsProfile] = useState<ProfileRow | null>(
    null,
  );

  /*
   * Navegación interna del dashboard.
   */
  const [section, setSection] = useState<Section>("radar");

  /*
   * ============================================================
   * EDITOR PUNTUAL DE AJUSTES
   * ============================================================
   */

  const [settingsEditorSection, setSettingsEditorSection] =
    useState<SettingsEditSection | null>(null);

  const [settingsEditorSaving, setSettingsEditorSaving] = useState(false);

  /*
   * ============================================================
   * ZONAS BLOQUEADAS
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
        console.error("❌ Error cargando presencia del radar", error);

        /*
         * Fail-safe:
         * si no podemos determinar el estado,
         * el radar queda apagado.
         */
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
   * RADAR
   * ============================================================
   */

  const { profiles, refresh } = useRadar({
    enabled: radarEnabled && !radarPresenceLoading,

    latitude: location.latitude,

    longitude: location.longitude,

    loading: location.loading,
  });

  /*
   * ============================================================
   * SINCRONIZACIÓN DE UBICACIÓN
   * ============================================================
   */

  useSyncLocation({
    enabled: radarEnabled && !radarPresenceLoading,

    latitude: location.latitude,

    longitude: location.longitude,

    accuracy: location.accuracy,

    loading: location.loading,
  });

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
   * CARGA DE ENLACES
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
   * CARGA DE ZONAS BLOQUEADAS
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
        console.error("❌ Error cargando zonas bloqueadas", error);

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
   * Contrato preparado para el siguiente sprint.
   */

  const events: EventCard[] = [];

  /*
   * ============================================================
   * TOGGLE RADAR
   * ============================================================
   */

  const handleRadarToggle = async () => {
    if (radarToggleLoading || !user) {
      return;
    }

    const nextEnabled = !radarEnabled;

    setRadarToggleLoading(true);

    try {
      await setRadarPresence(nextEnabled);

      setRadarEnabled(nextEnabled);
    } catch (error) {
      console.error("❌ Error cambiando presencia del radar", error);
    } finally {
      setRadarToggleLoading(false);
    }
  };

  /*
   * ============================================================
   * EDITOR DE PERFIL — ABRIR
   * ============================================================
   */

  const handleEditProfile = (editSection: SettingsEditSection = "profile") => {
    setSettingsEditorSection(editSection);
  };

  /*
   * ============================================================
   * EDITOR DE PERFIL — CERRAR
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
   * EDITOR DE PERFIL — GUARDAR
   * ============================================================
   */

  const handleSaveProfile = async (data: SettingsProfileEditorData) => {
    if (!user || !settingsProfile) {
      return;
    }

    setSettingsEditorSaving(true);

    try {
      let avatarUrl = settingsProfile.avatar_url ?? "";

      /*
       * La imagen solo se sube si el usuario
       * realmente seleccionó una nueva.
       */
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

      /*
       * Actualizamos la vista inmediatamente
       * sin obligar a recargar toda la aplicación.
       */
      if (result.profile) {
        setSettingsProfile(result.profile);
      }

      /*
       * Recargamos los links reales desde Supabase
       * para no depender del objeto temporal del editor.
       */
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
   * ZONAS BLOQUEADAS — ABRIR CREACIÓN
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
   * ZONAS BLOQUEADAS — ABRIR EDICIÓN
   * ============================================================
   */

  const handleEditBlockedZone = (zone: RadarBlockedZone) => {
    setEditingBlockedZone(zone);

    setBlockedZoneFormOpen(true);
  };

  /*
   * ============================================================
   * ZONAS BLOQUEADAS — CERRAR FORMULARIO
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
   * ZONAS BLOQUEADAS — GUARDAR
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
            `Solo puedes tener ${MAX_BLOCKED_ZONES} zonas bloqueadas.`,
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
      console.error("❌ Error guardando zona bloqueada", error);

      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert("No se pudo guardar la zona bloqueada.");
      }
    } finally {
      setBlockedZonesSaving(false);
    }
  };

  /*
   * ============================================================
   * ZONAS BLOQUEADAS — ELIMINAR
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
      console.error("❌ Error eliminando zona bloqueada", error);

      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert("No se pudo eliminar la zona bloqueada.");
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
    } catch (error) {
      console.error("❌ Error apagando radar antes de cerrar sesión", error);
    }

    await signOut();

    router.replace("/login");
  };

  /*
   * ============================================================
   * ESTADO DE CARGA
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
    <main
      className="
        min-h-screen
        bg-[#F7F8FC]
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-2xl
          px-4
          pb-6
          pt-4
          sm:px-6
        "
      >
        <DashboardHeader section={section} />

        {section === "radar" && (
          <RadarView
            enabled={radarEnabled}
            toggleLoading={radarToggleLoading}
            onToggle={handleRadarToggle}
            profiles={profiles}
            onRefresh={refresh}
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

      {/* ========================================================
          EDITOR PUNTUAL DE AJUSTES
          ======================================================== */}

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

      {/* ========================================================
          FORMULARIO DE ZONA BLOQUEADA
          ======================================================== */}

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
