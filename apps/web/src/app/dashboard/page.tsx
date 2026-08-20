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
  supabase,
  updateMyProfile,
  updateRadarBlockedZone,
  uploadAvatar,
  type BusinessProfileRow,
  type ProfileLink,
  type ProfileRow,
  type RadarBlockedZone,
} from "@lookup/services";

import type {
  CreatedEventDraft,
} from "@/lib/events/event-domain";

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
  CreateEventForm,
} from "./components/CreateEventForm";

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
  DeleteAccountDialog,
} from "./components/DeleteAccountDialog";

import {
  AppToast,
  type AppToastKind,
} from "./components/AppToast";

import {
  saveSettingsProfile,
} from "./services/save-settings-profile";

import {
  syncCurrentProfileEmbedding,
} from "./services/sync-profile-embedding";

type Section =
  | "radar"
  | "events"
  | "settings";

type ToastState = {
  id: number;
  kind: AppToastKind;
  message: string;
};

type DeleteAccountResponse = {
  success?: boolean;
  error?: string;
};

const MAX_BLOCKED_ZONES =
  3;

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
    session,
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

  const {
    profiles,
    refresh,
  } = useRadar({
    enabled:
      radarPresence.requested,

    ready:
      radarPresence.ready,
  });

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
    createEventOpen,
    setCreateEventOpen,
  ] =
    useState(false);

  const [
    createdEventDraft,
    setCreatedEventDraft,
  ] =
    useState<CreatedEventDraft | null>(
      null,
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

  const [
    deleteAccountOpen,
    setDeleteAccountOpen,
  ] =
    useState(false);

  const [
    deleteAccountLoading,
    setDeleteAccountLoading,
  ] =
    useState(false);

  const [
    deleteAccountError,
    setDeleteAccountError,
  ] =
    useState<string | null>(
      null,
    );

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

  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId =
      profile.id;

    let mounted =
      true;

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
      mounted =
        false;
    };
  }, [
    profile,
  ]);

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

    let mounted =
      true;

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
      mounted =
        false;
    };
  }, [
    profile,
  ]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const profileId =
      profile.id;

    let mounted =
      true;

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
      mounted =
        false;
    };
  }, [
    profile,
  ]);

  const events: EventCard[] =
    [];

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

  function handleOpenCreateEvent() {
    if (
      !session?.access_token
    ) {
      showToast(
        "error",
        "Tu sesión no es válida. Vuelve a iniciar sesión.",
      );

      return;
    }

    setCreateEventOpen(
      true,
    );
  }

  function handleCloseCreateEvent() {
    setCreateEventOpen(
      false,
    );
  }

  function handleEventCreated(
    draft: CreatedEventDraft,
  ) {
    setCreatedEventDraft(
      draft,
    );

    setCreateEventOpen(
      false,
    );

    showToast(
      "success",
      "Borrador creado correctamente. Ya está listo para analizarlo con LookUp.",
    );
  }

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

  async function syncSemanticProfileAfterSave() {
    const accessToken =
      session?.access_token;

    if (!accessToken) {
      console.warn(
        "⚠️ Perfil guardado sin sincronización semántica: no existe una sesión activa.",
      );

      return;
    }

    try {
      const result =
        await syncCurrentProfileEmbedding(
          accessToken,
        );

      console.info(
        "🧠 Perfil semántico sincronizado:",
        result.status,
      );
    } catch (error) {
      /*
       * El perfil ya está guardado.
       *
       * La IA es una capacidad secundaria y recuperable:
       * un fallo de OpenAI o de sincronización nunca debe
       * convertir en fallido el guardado del perfil.
       */

      console.error(
        "❌ El perfil se guardó, pero no pudo sincronizarse su embedding",
        error,
      );
    }
  }

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

        /*
         * El perfil ya está persistido antes de entrar aquí.
         *
         * OpenAI nunca controla si el usuario puede o no guardar
         * sus datos. Un fallo de IA queda aislado.
         */
        await syncSemanticProfileAfterSave();

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
          error instanceof
            Error
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
          error instanceof
            Error
            ? error.message
            : "No se pudo guardar la zona privada.",
        );
      } finally {
        setBlockedZonesSaving(
          false,
        );
      }
    };

  const handleDeleteBlockedZone =
    (
      zone:
        RadarBlockedZone,
    ) => {
      setBlockedZonePendingDelete(
        zone,
      );
    };

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
          error instanceof
            Error
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
   * ELIMINAR CUENTA
   * ============================================================
   */

  const handleOpenDeleteAccount =
    () => {
      setDeleteAccountError(
        null,
      );

      setDeleteAccountOpen(
        true,
      );
    };

  const handleCloseDeleteAccount =
    () => {
      if (
        deleteAccountLoading
      ) {
        return;
      }

      setDeleteAccountError(
        null,
      );

      setDeleteAccountOpen(
        false,
      );
    };

  const handleDeleteAccount =
    async () => {
      if (
        deleteAccountLoading
      ) {
        return;
      }

      const accessToken =
        session?.access_token;

      if (!accessToken) {
        setDeleteAccountError(
          "Tu sesión no es válida. Vuelve a iniciar sesión antes de eliminar la cuenta.",
        );

        return;
      }

      setDeleteAccountError(
        null,
      );

      setDeleteAccountLoading(
        true,
      );

      try {
        try {
          await radarPresence.disable();
        } catch (radarError) {
          console.error(
            "❌ No se pudo apagar Radar antes de eliminar la cuenta",
            radarError,
          );
        }

        const response =
          await fetch(
            "/api/account/delete",
            {
              method:
                "DELETE",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  confirmation:
                    "ELIMINAR",
                }),
            },
          );

        let payload:
          DeleteAccountResponse | null =
          null;

        try {
          payload =
            (await response.json()) as DeleteAccountResponse;
        } catch {
          payload =
            null;
        }

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ??
              "No se pudo eliminar la cuenta.",
          );
        }

        const {
          error:
            localSignOutError,
        } =
          await supabase.auth.signOut({
            scope:
              "local",
          });

        if (
          localSignOutError
        ) {
          console.error(
            "❌ La cuenta fue eliminada pero no se pudo limpiar la sesión local",
            localSignOutError,
          );
        }

        setDeleteAccountOpen(
          false,
        );

        router.replace(
          "/login",
        );

        router.refresh();
      } catch (error) {
        console.error(
          "❌ Error eliminando cuenta",
          error,
        );

        setDeleteAccountError(
          error instanceof
            Error
            ? error.message
            : "No se pudo eliminar la cuenta.",
        );
      } finally {
        setDeleteAccountLoading(
          false,
        );
      }
    };

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

  const accountName =
    settingsProfile.full_name?.trim() ||
    settingsProfile.username?.trim() ||
    (
      settingsProfile.account_type ===
      "business"
        ? "tu negocio"
        : "tu perfil"
    );

  const defaultEventCity =
    businessProfile?.city?.trim() ||
    settingsProfile.city?.trim() ||
    "";

  const defaultEventProvince =
    businessProfile?.province?.trim() ||
    "";

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4 sm:px-6">
        <DashboardHeader
          section={
            section
          }
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

            city={
              defaultEventCity
            }

            createdDraft={
              createdEventDraft
            }

            onCreateEvent={
              handleOpenCreateEvent
            }

            onJoinEvent={(
              id,
            ) =>
              console.log(
                "Ver evento",
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

            onDeleteAccount={
              handleOpenDeleteAccount
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

      {createEventOpen &&
      session?.access_token ? (
        <CreateEventForm
          accessToken={
            session.access_token
          }

          defaultCity={
            defaultEventCity
          }

          defaultProvince={
            defaultEventProvince
          }

          onCreated={
            handleEventCreated
          }

          onClose={
            handleCloseCreateEvent
          }
        />
      ) : null}

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

      <DeleteAccountDialog
        open={
          deleteAccountOpen
        }

        loading={
          deleteAccountLoading
        }

        error={
          deleteAccountError
        }

        accountName={
          accountName
        }

        onCancel={
          handleCloseDeleteAccount
        }

        onClearError={() =>
          setDeleteAccountError(
            null,
          )
        }

        onConfirm={
          handleDeleteAccount
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