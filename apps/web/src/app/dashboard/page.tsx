"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createRadarBlockedZone,
  deleteRadarBlockedZone,
  getMyBusinessProfile,
  getProfileLinks,
  getRadarBlockedZones,
  updateMyProfile,
  updateRadarBlockedZone,
  uploadAvatar,
  type BusinessProfileRow,
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
  ConfirmDialog,
} from "./components/ConfirmDialog";

import {
  AppToast,
  type AppToastKind,
} from "./components/AppToast";

import {
  saveSettingsProfile,
} from "./services/save-settings-profile";

type Section =
  | "radar"
  | "events"
  | "settings";

type ToastState = {
  id: number;
  kind: AppToastKind;
  message: string;
};

const MAX_BLOCKED_ZONES = 3;

function isSection(
  value: string | null,
): value is Section {
  return (
    value === "radar" ||
    value === "events" ||
    value === "settings"
  );
}

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
  ] =
    useState(false);

  /*
   * ============================================================
   * RADAR / DESCUBRIMIENTO
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
   * PERFIL / SETTINGS
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
    businessProfile,
    setBusinessProfile,
  ] =
    useState<BusinessProfileRow | null>(
      null,
    );

  const [
    businessProfileLoading,
    setBusinessProfileLoading,
  ] =
    useState(false);

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

  const [
    settingsEditorError,
    setSettingsEditorError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    profileVisibilitySaving,
    setProfileVisibilitySaving,
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

  const [
    blockedZonePendingDelete,
    setBlockedZonePendingDelete,
  ] =
    useState<RadarBlockedZone | null>(
      null,
    );

  /*
   * ============================================================
   * FEEDBACK
   * ============================================================
   */

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null,
    );

  const showToast =
    useCallback(
      (
        kind: AppToastKind,
        message: string,
      ) => {
        setToast({
          id: Date.now(),
          kind,
          message,
        });
      },
      [],
    );

  /*
   * ============================================================
   * SECCIÓN INICIAL DESDE URL
   * ============================================================
   */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const requestedSection =
      params.get(
        "section",
      );

    if (
      isSection(
        requestedSection,
      )
    ) {
      setSection(
        requestedSection,
      );
    }
  }, []);

  /*
   * ============================================================
   * PROTECCIÓN DE RUTA
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
   * SINCRONIZAR PERFIL LOCAL
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
   * CARGAR LINKS
   * ============================================================
   *
   * Capturamos profileId antes de entrar en la función async.
   *
   * Esto evita que TypeScript pierda el narrowing de `profile`
   * dentro del closure asíncrono.
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
   * CARGAR BUSINESS PROFILE
   * ============================================================
   */

  useEffect(() => {
    if (
      !profile ||
      profile.account_type !==
        "business"
    ) {
      setBusinessProfile(
        null,
      );

      setBusinessProfileLoading(
        false,
      );

      return;
    }

    const profileId =
      profile.id;

    let mounted = true;

    async function loadBusinessProfile() {
      setBusinessProfileLoading(
        true,
      );

      try {
        const result =
          await getMyBusinessProfile(
            profileId,
          );

        if (mounted) {
          setBusinessProfile(
            result,
          );
        }
      } catch (error) {
        console.error(
          "❌ Error cargando perfil de empresa",
          error,
        );

        if (mounted) {
          setBusinessProfile(
            null,
          );
        }
      } finally {
        if (mounted) {
          setBusinessProfileLoading(
            false,
          );
        }
      }
    }

    void loadBusinessProfile();

    return () => {
      mounted = false;
    };
  }, [
    profile,
  ]);

  /*
   * ============================================================
   * CARGAR ZONAS PRIVADAS
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

  const events: EventCard[] =
    [];

  /*
   * ============================================================
   * NAVEGACIÓN
   * ============================================================
   */

  function handleSectionChange(
    nextSection: Section,
  ) {
    setSection(
      nextSection,
    );

    router.replace(
      `/dashboard?section=${nextSection}`,
      {
        scroll: false,
      },
    );
  }

  /*
   * ============================================================
   * SINCRONIZACIÓN PRIVACIDAD / RADAR
   * ============================================================
   */

  async function refreshRadarPrivacyState(
    reactivateIfProtected = false,
  ) {
    try {
      if (
        reactivateIfProtected &&
        radarPresence.privacyBlocked
      ) {
        await radarPresence.toggle();

        return;
      }

      if (
        radarPresence.requested
      ) {
        await radarPresence.syncNow();
      }
    } catch (error) {
      console.error(
        "❌ Error resincronizando Radar tras actualizar privacidad",
        error,
      );
    }
  }

  /*
   * ============================================================
   * RADAR
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

        showToast(
          "error",
          "No se pudo actualizar el Radar.",
        );
      } finally {
        setRadarScanLoading(
          false,
        );
      }
    };

  /*
   * ============================================================
   * ABRIR EDITOR
   * ============================================================
   */

  const handleEditProfile = (
    editSection:
      SettingsEditSection =
      "profile",
  ) => {
    if (
      settingsProfile?.account_type ===
        "business" &&
      (
        businessProfileLoading ||
        !businessProfile
      )
    ) {
      showToast(
        "error",
        "Todavía no hemos podido cargar los datos del negocio.",
      );

      return;
    }

    setSettingsEditorError(
      null,
    );

    setSettingsEditorSection(
      editSection,
    );
  };

  /*
   * ============================================================
   * CERRAR EDITOR
   * ============================================================
   */

  const handleCloseProfileEditor =
    () => {
      if (
        settingsEditorSaving
      ) {
        return;
      }

      setSettingsEditorError(
        null,
      );

      setSettingsEditorSection(
        null,
      );
    };

  /*
   * ============================================================
   * GUARDAR PERFIL
   * ============================================================
   */

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

      const currentAccountType =
        settingsProfile.account_type;

      setSettingsEditorError(
        null,
      );

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

        /*
         * ======================================================
         * SINCRONÍA BUSINESS LOCAL
         * ======================================================
         *
         * PostgreSQL ya guardó profiles + business_profiles +
         * profile_links dentro de la misma transacción.
         *
         * Aquí simplemente reflejamos los nuevos valores en la UI
         * sin obligar al usuario a recargar.
         */

        if (
          currentAccountType ===
            "business"
        ) {
          setBusinessProfile(
            (current) =>
              current
                ? {
                    ...current,

                    trade_name:
                      data.fullName,

                    sector:
                      data.profession,

                    city:
                      data.businessCity,

                    province:
                      data.businessProvince,

                    website:
                      data.businessWebsite ||
                      null,

                    updated_at:
                      new Date().toISOString(),
                  }
                : current,
          );
        }

        /*
         * ======================================================
         * RECARGAR REDES
         * ======================================================
         */

        try {
          const updatedLinks =
            await getProfileLinks(
              user.id,
            );

          setProfileLinks(
            updatedLinks ?? [],
          );
        } catch (linksError) {
          console.error(
            "❌ El perfil se guardó, pero no se pudieron recargar las redes",
            linksError,
          );

          setProfileLinks(
            data.socialLinks,
          );
        }

        setSettingsEditorSection(
          null,
        );

        showToast(
          "success",
          currentAccountType ===
            "business"
            ? "Los datos públicos del negocio se actualizaron correctamente."
            : "Tu perfil se actualizó correctamente.",
        );
      } catch (error) {
        console.error(
          "❌ Error guardando edición de perfil",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los cambios.";

        setSettingsEditorError(
          message,
        );
      } finally {
        setSettingsEditorSaving(
          false,
        );
      }
    };

  /*
   * ============================================================
   * VISIBILIDAD DEL PERFIL
   * ============================================================
   */

  const handleToggleProfileVisibility =
    async () => {
      if (
        !user ||
        !settingsProfile ||
        profileVisibilitySaving
      ) {
        return;
      }

      const nextVisibility =
        !settingsProfile.visibility;

      setProfileVisibilitySaving(
        true,
      );

      try {
        const result =
          await updateMyProfile(
            user.id,
            {
              visibility:
                nextVisibility,
            },
          );

        if (
          result.error
        ) {
          throw result.error;
        }

        setSettingsProfile(
          result.data,
        );

        /*
         * Si el Radar está activo, solicitamos una nueva
         * sincronización para que el estado de descubrimiento
         * refleje inmediatamente la nueva visibilidad.
         */

        if (
          radarPresence.requested
        ) {
          try {
            await radarPresence.syncNow();
          } catch (radarError) {
            console.error(
              "❌ La visibilidad cambió pero Radar no pudo resincronizar inmediatamente",
              radarError,
            );
          }
        }

        showToast(
          "success",
          nextVisibility
            ? "Tu perfil vuelve a ser público."
            : "Tu perfil ahora es privado y deja de descubrirse públicamente.",
        );
      } catch (error) {
        console.error(
          "❌ Error actualizando visibilidad del perfil",
          error,
        );

        showToast(
          "error",
          "No se pudo cambiar la visibilidad del perfil.",
        );
      } finally {
        setProfileVisibilitySaving(
          false,
        );
      }
    };

  /*
   * ============================================================
   * AÑADIR ZONA PRIVADA
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

  /*
   * ============================================================
   * EDITAR ZONA PRIVADA
   * ============================================================
   */

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

  /*
   * ============================================================
   * CERRAR FORM ZONA PRIVADA
   * ============================================================
   */

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

  /*
   * ============================================================
   * GUARDAR ZONA PRIVADA
   * ============================================================
   */

  const handleSaveBlockedZone =
    async (
      data:
        BlockedZoneFormData,
    ) => {
      if (!profile) {
        return;
      }

      const profileId =
        profile.id;

      const wasEditing =
        editingBlockedZone !==
        null;

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
                profileId,

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

        await refreshRadarPrivacyState(
          wasEditing,
        );

        showToast(
          "success",
          wasEditing
            ? "La zona privada se actualizó correctamente."
            : "La nueva zona privada ya está protegiendo tu privacidad.",
        );
      } catch (error) {
        console.error(
          "❌ Error guardando zona privada",
          error,
        );

        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "No se pudo guardar la zona privada.",
        );
      } finally {
        setBlockedZonesSaving(
          false,
        );
      }
    };

  /*
   * ============================================================
   * SOLICITAR BORRADO ZONA
   * ============================================================
   */

  const handleDeleteBlockedZone =
    (
      zone:
        RadarBlockedZone,
    ) => {
      setBlockedZonePendingDelete(
        zone,
      );
    };

  /*
   * ============================================================
   * CONFIRMAR BORRADO ZONA
   * ============================================================
   */

  const handleConfirmDeleteBlockedZone =
    async () => {
      if (
        !blockedZonePendingDelete
      ) {
        return;
      }

      const zoneId =
        blockedZonePendingDelete.id;

      setBlockedZonesSaving(
        true,
      );

      try {
        await deleteRadarBlockedZone(
          zoneId,
        );

        setBlockedZones(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                zoneId,
            ),
        );

        setBlockedZonePendingDelete(
          null,
        );

        await refreshRadarPrivacyState(
          true,
        );

        showToast(
          "success",
          "La zona privada se eliminó.",
        );
      } catch (error) {
        console.error(
          "❌ Error eliminando zona privada",
          error,
        );

        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la zona privada.",
        );
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

  /*
   * ============================================================
   * UI
   * ============================================================
   */

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
            events={
              events
            }

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

            radarPrivacyBlocked={
              radarPresence.privacyBlocked
            }

            radarToggleLoading={
              radarPresence.toggleLoading
            }

            profileVisibilitySaving={
              profileVisibilitySaving
            }

            onToggleRadar={
              handleRadarToggle
            }

            onToggleProfileVisibility={
              handleToggleProfileVisibility
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
          active={
            section
          }

          onChange={(
            nextSection,
          ) =>
            handleSectionChange(
              nextSection as Section,
            )
          }
        />
      </div>

      {settingsEditorSection ? (
        <SettingsProfileEditor
          profile={
            settingsProfile
          }

          businessProfile={
            businessProfile
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

          saveError={
            settingsEditorError
          }

          onSave={
            handleSaveProfile
          }

          onClose={
            handleCloseProfileEditor
          }
        />
      ) : null}

      {blockedZoneFormOpen ? (
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
      ) : null}

      <ConfirmDialog
        open={
          blockedZonePendingDelete !==
          null
        }

        variant="privacy"

        title="Eliminar zona privada"

        description={
          blockedZonePendingDelete
            ? `“${blockedZonePendingDelete.name}” dejará de proteger tu presencia. Si vuelves a ese lugar con el Radar activo, LookUp ya no lo desactivará automáticamente.`
            : ""
        }

        confirmLabel="Eliminar"

        loading={
          blockedZonesSaving
        }

        onCancel={() => {
          if (
            !blockedZonesSaving
          ) {
            setBlockedZonePendingDelete(
              null,
            );
          }
        }}

        onConfirm={
          handleConfirmDeleteBlockedZone
        }
      />

      {toast ? (
        <AppToast
          toastKey={
            toast.id
          }

          kind={
            toast.kind
          }

          message={
            toast.message
          }

          onClose={() =>
            setToast(
              null,
            )
          }
        />
      ) : null}
    </main>
  );
}