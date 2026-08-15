"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createRadarBlockedZone,
  deleteRadarBlockedZone,
  getProfileLinks,
  getRadarBlockedZones,
  updateRadarBlockedZone,
  uploadAvatar,
  type ProfileLink,
  type ProfileRow,
  type RadarBlockedZone,
} from "@lookup/services";

import {
  BottomNav,
} from "../../components/bottom-nav";

import {
  useAuth,
} from "../../components/auth-provider";

import {
  useRadarPresence,
} from "../../components/radar-provider";

import {
  useProfileStatus,
} from "../../hooks/use-profile-status";

import {
  useRadar,
} from "./hooks/useRadar";

import {
  DashboardHeader,
} from "./components/DashboardHeader";

import {
  RadarView,
} from "./components/RadarView";

import {
  EventsView,
  type EventCard,
} from "./components/EventsView";

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

import {
  saveSettingsProfile,
} from "./services/save-settings-profile";

type Section =
  | "radar"
  | "events"
  | "settings";

const MAX_BLOCKED_ZONES = 3;

export default function DashboardPage() {
  const router =
    useRouter();

  const {
    signOut,
  } = useAuth();

  const {
    user,
    profile,
    loading,
    needsOnboarding,
  } = useProfileStatus();

  const radarPresence =
    useRadarPresence();

  const [
    radarScanLoading,
    setRadarScanLoading,
  ] = useState(false);

  /*
   * ============================================================
   * DESCUBRIMIENTO
   * ============================================================
   */

  const {
    profiles,
    refresh,
  } = useRadar({
    enabled:
      radarPresence.requested,

    ready:
      radarPresence.ready,
  });

  /*
   * ============================================================
   * PERFIL / AJUSTES
   * ============================================================
   */

  const [
    profileLinks,
    setProfileLinks,
  ] =
    useState<ProfileLink[]>(
      [],
    );

  const [
    settingsProfile,
    setSettingsProfile,
  ] =
    useState<ProfileRow | null>(
      null,
    );

  const [
    section,
    setSection,
  ] =
    useState<Section>(
      "radar",
    );

  const [
    settingsEditorSection,
    setSettingsEditorSection,
  ] =
    useState<SettingsEditSection | null>(
      null,
    );

  const [
    settingsEditorSaving,
    setSettingsEditorSaving,
  ] =
    useState(false);

  /*
   * ============================================================
   * ZONAS PRIVADAS
   * ============================================================
   */

  const [
    blockedZones,
    setBlockedZones,
  ] =
    useState<RadarBlockedZone[]>(
      [],
    );

  const [
    blockedZonesLoading,
    setBlockedZonesLoading,
  ] =
    useState(true);

  const [
    blockedZonesSaving,
    setBlockedZonesSaving,
  ] =
    useState(false);

  const [
    blockedZoneFormOpen,
    setBlockedZoneFormOpen,
  ] =
    useState(false);

  const [
    editingBlockedZone,
    setEditingBlockedZone,
  ] =
    useState<RadarBlockedZone | null>(
      null,
    );

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
      router.replace(
        "/login",
      );

      return;
    }

    if (
      needsOnboarding
    ) {
      router.replace(
        "/onboarding",
      );
    }
  }, [
    loading,
    user,
    needsOnboarding,
    router,
  ]);

  /*
   * ============================================================
   * PERFIL LOCAL
   * ============================================================
   */

  useEffect(() => {
    if (!profile) {
      return;
    }

    setSettingsProfile(
      profile,
    );
  }, [
    profile,
  ]);

  /*
   * ============================================================
   * LINKS
   * ============================================================
   */

  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId =
      profile.id;

    let mounted = true;

    async function loadLinks() {
      try {
        const links =
          await getProfileLinks(
            profileId,
          );

        if (mounted) {
          setProfileLinks(
            links ?? [],
          );
        }
      } catch (error) {
        console.error(
          "❌ Error cargando enlaces del perfil",
          error,
        );

        if (mounted) {
          setProfileLinks(
            [],
          );
        }
      }
    }

    void loadLinks();

    return () => {
      mounted = false;
    };
  }, [
    profile,
  ]);

  /*
   * ============================================================
   * ZONAS PRIVADAS
   * ============================================================
   */

  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId =
      profile.id;

    let mounted = true;

    async function loadBlockedZones() {
      setBlockedZonesLoading(
        true,
      );

      try {
        const zones =
          await getRadarBlockedZones(
            profileId,
          );

        if (mounted) {
          setBlockedZones(
            zones ?? [],
          );
        }
      } catch (error) {
        console.error(
          "❌ Error cargando zonas privadas",
          error,
        );

        if (mounted) {
          setBlockedZones(
            [],
          );
        }
      } finally {
        if (mounted) {
          setBlockedZonesLoading(
            false,
          );
        }
      }
    }

    void loadBlockedZones();

    return () => {
      mounted = false;
    };
  }, [
    profile,
  ]);

  /*
   * ============================================================
   * EVENTOS
   * ============================================================
   */

  const events: EventCard[] = [];

  /*
   * ============================================================
   * TOGGLE RADAR
   * ============================================================
   */

  const handleRadarToggle =
    async () => {
      if (
        radarScanLoading
      ) {
        return;
      }

      await radarPresence.toggle();
    };

  /*
   * ============================================================
   * ESCANEAR
   * ============================================================
   */

  const handleRadarRefresh =
    async () => {
      if (
        radarScanLoading ||
        radarPresence.toggleLoading ||
        !radarPresence.requested ||
        !radarPresence.ready
      ) {
        return;
      }

      setRadarScanLoading(
        true,
      );

      try {
        const radarAllowed =
          await radarPresence.syncNow();

        if (
          !radarAllowed
        ) {
          return;
        }

        await refresh();
      } catch (error) {
        console.error(
          "❌ Error escaneando conexiones cercanas",
          error,
        );
      } finally {
        setRadarScanLoading(
          false,
        );
      }
    };

  /*
   * ============================================================
   * EDITOR PERFIL
   * ============================================================
   */

  const handleEditProfile = (
    editSection:
      SettingsEditSection =
      "profile",
  ) => {
    setSettingsEditorSection(
      editSection,
    );
  };

  const handleCloseProfileEditor =
    () => {
      if (
        settingsEditorSaving
      ) {
        return;
      }

      setSettingsEditorSection(
        null,
      );
    };

  const handleSaveProfile =
    async (
      data:
        SettingsProfileEditorData,
    ) => {
      if (
        !user ||
        !settingsProfile
      ) {
        return;
      }

      setSettingsEditorSaving(
        true,
      );

      try {
        let avatarUrl =
          settingsProfile
            .avatar_url ??
          "";

        if (
          data.avatarFile
        ) {
          avatarUrl =
            await uploadAvatar(
              user.id,
              data.avatarFile,
            );
        }

        const result =
          await saveSettingsProfile({
            userId:
              user.id,

            email:
              user.email ??
              "",

            profile:
              settingsProfile,

            data,

            avatarUrl,
          });

        if (
          result.profile
        ) {
          setSettingsProfile(
            result.profile,
          );
        }

        const updatedLinks =
          await getProfileLinks(
            user.id,
          );

        setProfileLinks(
          updatedLinks ?? [],
        );

        setSettingsEditorSection(
          null,
        );
      } catch (error) {
        console.error(
          "❌ Error guardando edición de perfil",
          error,
        );

        if (
          error instanceof Error
        ) {
          window.alert(
            error.message,
          );
        } else {
          window.alert(
            "No se pudieron guardar los cambios.",
          );
        }
      } finally {
        setSettingsEditorSaving(
          false,
        );
      }
    };

  /*
   * ============================================================
   * ZONAS PRIVADAS
   * ============================================================
   */

  const handleAddBlockedZone =
    () => {
      if (
        blockedZones.length >=
        MAX_BLOCKED_ZONES
      ) {
        return;
      }

      setEditingBlockedZone(
        null,
      );

      setBlockedZoneFormOpen(
        true,
      );
    };

  const handleEditBlockedZone =
    (
      zone:
        RadarBlockedZone,
    ) => {
      setEditingBlockedZone(
        zone,
      );

      setBlockedZoneFormOpen(
        true,
      );
    };

  const handleCloseBlockedZoneForm =
    () => {
      if (
        blockedZonesSaving
      ) {
        return;
      }

      setBlockedZoneFormOpen(
        false,
      );

      setEditingBlockedZone(
        null,
      );
    };

  const handleSaveBlockedZone =
    async (
      data:
        BlockedZoneFormData,
    ) => {
      if (!profile) {
        return;
      }

      setBlockedZonesSaving(
        true,
      );

      try {
        if (
          editingBlockedZone
        ) {
          const updated =
            await updateRadarBlockedZone(
              editingBlockedZone.id,
              {
                name:
                  data.name,

                address:
                  data.address,

                latitude:
                  data.latitude,

                longitude:
                  data.longitude,

                radius_meters:
                  data.radiusMeters,
              },
            );

          setBlockedZones(
            (current) =>
              current.map(
                (zone) =>
                  zone.id ===
                  updated.id
                    ? updated
                    : zone,
              ),
          );
        } else {
          if (
            blockedZones.length >=
            MAX_BLOCKED_ZONES
          ) {
            throw new Error(
              `Solo puedes tener ${MAX_BLOCKED_ZONES} zonas privadas.`,
            );
          }

          const created =
            await createRadarBlockedZone({
              profile_id:
                profile.id,

              name:
                data.name,

              address:
                data.address,

              latitude:
                data.latitude,

              longitude:
                data.longitude,

              radius_meters:
                data.radiusMeters,
            });

          setBlockedZones(
            (current) => [
              ...current,
              created,
            ],
          );
        }

        setBlockedZoneFormOpen(
          false,
        );

        setEditingBlockedZone(
          null,
        );
      } catch (error) {
        console.error(
          "❌ Error guardando zona privada",
          error,
        );

        if (
          error instanceof Error
        ) {
          window.alert(
            error.message,
          );
        } else {
          window.alert(
            "No se pudo guardar la zona privada.",
          );
        }
      } finally {
        setBlockedZonesSaving(
          false,
        );
      }
    };

  const handleDeleteBlockedZone =
    async (
      zone:
        RadarBlockedZone,
    ) => {
      const confirmed =
        window.confirm(
          `¿Quieres eliminar la zona "${zone.name}"?`,
        );

      if (!confirmed) {
        return;
      }

      setBlockedZonesSaving(
        true,
      );

      try {
        await deleteRadarBlockedZone(
          zone.id,
        );

        setBlockedZones(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                zone.id,
            ),
        );
      } catch (error) {
        console.error(
          "❌ Error eliminando zona privada",
          error,
        );

        if (
          error instanceof Error
        ) {
          window.alert(
            error.message,
          );
        } else {
          window.alert(
            "No se pudo eliminar la zona privada.",
          );
        }
      } finally {
        setBlockedZonesSaving(
          false,
        );
      }
    };

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout =
    async () => {
      try {
        await radarPresence.disable();
      } catch (error) {
        console.error(
          "❌ Error apagando Radar antes de cerrar sesión",
          error,
        );
      }

      await signOut();

      router.replace(
        "/login",
      );
    };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (
    loading ||
    radarPresence.presenceLoading ||
    !user
  ) {
    return null;
  }

  if (
    !profile ||
    !settingsProfile
  ) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4 sm:px-6">
        <DashboardHeader
          section={section}
        />

        {section ===
          "radar" && (
          <RadarView
            enabled={
              radarPresence.requested
            }

            radarReady={
              radarPresence.ready
            }

            privacyBlocked={
              radarPresence.privacyBlocked
            }

            toggleLoading={
              radarPresence.toggleLoading
            }

            scanLoading={
              radarScanLoading
            }

            locationLoading={
              radarPresence.locationLoading
            }

            locationSyncing={
              radarPresence.locationSyncing
            }

            locationError={
              radarPresence.locationError
            }

            accuracy={
              radarPresence.accuracy
            }

            onToggle={
              handleRadarToggle
            }

            onRefresh={
              handleRadarRefresh
            }

            profiles={
              profiles
            }
          />
        )}

        {section ===
          "events" && (
          <EventsView
            events={events}

            onCreateEvent={() =>
              console.log(
                "Crear evento",
              )
            }

            onJoinEvent={(id) =>
              console.log(
                "Unirse",
                id,
              )
            }
          />
        )}

        {section ===
          "settings" && (
          <SettingsView
            profile={
              settingsProfile
            }

            links={
              profileLinks
            }

            radarEnabled={
              radarPresence.enabled
            }

            radarToggleLoading={
              radarPresence.toggleLoading
            }

            onToggleRadar={
              handleRadarToggle
            }

            blockedZones={
              blockedZones
            }

            blockedZonesLoading={
              blockedZonesLoading
            }

            blockedZonesSaving={
              blockedZonesSaving
            }

            canAddBlockedZone={
              blockedZones.length <
              MAX_BLOCKED_ZONES
            }

            maxBlockedZones={
              MAX_BLOCKED_ZONES
            }

            onAddBlockedZone={
              handleAddBlockedZone
            }

            onEditBlockedZone={
              handleEditBlockedZone
            }

            onDeleteBlockedZone={
              handleDeleteBlockedZone
            }

            onEditProfile={
              handleEditProfile
            }

            onLogout={
              handleLogout
            }
          />
        )}

        <BottomNav
          active={section}

          onChange={(
            nextSection,
          ) =>
            setSection(
              nextSection as Section,
            )
          }
        />
      </div>

      {settingsEditorSection && (
        <SettingsProfileEditor
          profile={
            settingsProfile
          }

          links={
            profileLinks
          }

          section={
            settingsEditorSection
          }

          saving={
            settingsEditorSaving
          }

          onSave={
            handleSaveProfile
          }

          onClose={
            handleCloseProfileEditor
          }
        />
      )}

      {blockedZoneFormOpen && (
        <BlockedZoneForm
          zone={
            editingBlockedZone
          }

          saving={
            blockedZonesSaving
          }

          onSubmit={
            handleSaveBlockedZone
          }

          onCancel={
            handleCloseBlockedZoneForm
          }
        />
      )}
    </main>
  );
}