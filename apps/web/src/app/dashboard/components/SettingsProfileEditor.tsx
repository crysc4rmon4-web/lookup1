"use client";

import Image from "next/image";

import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  INTEREST_OPTIONS,
  SOCIAL_PLATFORMS,
  type Platform,
} from "@lookup/config";

import type {
  BusinessProfileRow,
  ProfileLink,
  ProfileRow,
} from "@lookup/services";

import {
  PlatformCard,
} from "@/components/ui/PlatformCard";

import {
  SocialIcon,
} from "@/components/ui/SocialIcon";

import {
  BUSINESS_SECTORS,
} from "../../onboarding/business/constants";

import type {
  SettingsEditSection,
} from "./SettingsView";

export type SettingsProfileEditorData = {
  fullName: string;
  profession: string;
  bio: string;
  interests: string[];
  socialLinks: ProfileLink[];
  avatarFile: File | null;

  businessCity: string;
  businessProvince: string;
  businessWebsite: string;
};

type SettingsProfileEditorProps = {
  profile: ProfileRow;
  businessProfile: BusinessProfileRow | null;
  links: ProfileLink[];
  section: SettingsEditSection;
  saving: boolean;
  saveError: string | null;

  onSave: (
    data: SettingsProfileEditorData,
  ) => void | Promise<void>;

  onClose: () => void;
};

function getInitials(
  name: string,
) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ??
        "",
    )
    .join("");
}

function getTitle(
  section: SettingsEditSection,
  isBusiness: boolean,
) {
  switch (section) {
    case "socials":
      return "Redes sociales";

    case "name":
      return isBusiness
        ? "Editar nombre comercial"
        : "Editar nombre";

    case "profession":
      return isBusiness
        ? "Editar sector"
        : "Editar profesión";

    case "bio":
      return isBusiness
        ? "Editar descripción"
        : "Editar biografía";

    case "interests":
      return isBusiness
        ? "Temas y categorías"
        : "Editar intereses";

    case "profile":
    default:
      return isBusiness
        ? "Editar negocio"
        : "Editar perfil";
  }
}

function getDescription(
  section: SettingsEditSection,
  isBusiness: boolean,
) {
  switch (section) {
    case "socials":
      return isBusiness
        ? "Elige los canales donde quieres que los clientes puedan encontrarte."
        : "Elige dónde quieres que otras personas puedan encontrarte.";

    case "name":
      return isBusiness
        ? "Actualiza el nombre comercial que verá la comunidad."
        : "Actualiza el nombre visible de tu perfil.";

    case "profession":
      return isBusiness
        ? "Selecciona el sector que mejor representa tu actividad."
        : "Actualiza a qué te dedicas.";

    case "bio":
      return isBusiness
        ? "Describe brevemente qué hace tu negocio."
        : "Cuenta brevemente quién eres y qué haces.";

    case "interests":
      return isBusiness
        ? "Selecciona los temas que ayudan a entender qué ofrece tu negocio."
        : "Selecciona los temas que mejor representan tus intereses.";

    case "profile":
    default:
      return isBusiness
        ? "Actualiza la información pública principal de tu negocio."
        : "Actualiza la información pública principal de tu perfil.";
  }
}

function createProfileLink(
  profileId: string,
  platform: string,
): ProfileLink {
  return {
    id: `new-${platform}-${Date.now()}`,
    profile_id: profileId,
    platform,
    url: "",
  } as ProfileLink;
}

function getInputLabel(
  platform: Platform,
) {
  if (platform.type === "phone") {
    return "Número de teléfono";
  }

  if (platform.type === "url") {
    return "Enlace";
  }

  return "Usuario";
}

function isValidWebsite(
  value: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    return true;
  }

  try {
    new URL(
      /^https?:\/\//i.test(
        normalized,
      )
        ? normalized
        : `https://${normalized}`,
    );

    return true;
  } catch {
    return false;
  }
}

export function SettingsProfileEditor({
  profile,
  businessProfile,
  links,
  section,
  saving,
  saveError,
  onSave,
  onClose,
}: SettingsProfileEditorProps) {
  const isBusiness =
    profile.account_type ===
    "business";

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    fullName,
    setFullName,
  ] = useState(
    profile.full_name ?? "",
  );

  const [
    profession,
    setProfession,
  ] = useState(
    profile.profession ?? "",
  );

  const [
    bio,
    setBio,
  ] = useState(
    profile.bio ?? "",
  );

  const [
    interests,
    setInterests,
  ] = useState<string[]>(
    profile.interests ?? [],
  );

  const [
    businessCity,
    setBusinessCity,
  ] = useState(
    businessProfile?.city ??
      profile.city ??
      "",
  );

  const [
    businessProvince,
    setBusinessProvince,
  ] = useState(
    businessProfile?.province ??
      "",
  );

  const [
    businessWebsite,
    setBusinessWebsite,
  ] = useState(
    businessProfile?.website ??
      "",
  );

  const [
    socialLinks,
    setSocialLinks,
  ] =
    useState<ProfileLink[]>(
      links,
    );

  const [
    avatarFile,
    setAvatarFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      profile.avatar_url ??
        null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    platformPickerOpen,
    setPlatformPickerOpen,
  ] =
    useState(false);

  const [
    showAllPlatforms,
    setShowAllPlatforms,
  ] =
    useState(false);

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [
    previewUrl,
  ]);

  const selectedPlatforms =
    useMemo(
      () =>
        new Set(
          socialLinks.map(
            (link) =>
              link.platform,
          ),
        ),
      [
        socialLinks,
      ],
    );

  const selectablePlatforms =
    useMemo(
      () => {
        const enabled =
          SOCIAL_PLATFORMS.filter(
            (platform) =>
              platform.enabled &&
              !selectedPlatforms.has(
                platform.id,
              ),
          );

        if (
          showAllPlatforms
        ) {
          return enabled;
        }

        return enabled.filter(
          (platform) =>
            platform.featured,
        );
      },
      [
        selectedPlatforms,
        showAllPlatforms,
      ],
    );

  const currentBusinessSectorExists =
    BUSINESS_SECTORS.some(
      (sector) =>
        sector.label ===
        profession,
    );

  function handleAvatarChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setError(
        "Selecciona un archivo de imagen válido.",
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "La imagen no puede superar los 5 MB.",
      );

      return;
    }

    if (
      previewUrl?.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setAvatarFile(
      file,
    );

    setPreviewUrl(
      URL.createObjectURL(
        file,
      ),
    );

    setError(
      null,
    );
  }

  function toggleInterest(
    interestId: string,
  ) {
    setInterests(
      (current) =>
        current.includes(
          interestId,
        )
          ? current.filter(
              (item) =>
                item !==
                interestId,
            )
          : [
              ...current,
              interestId,
            ],
    );

    setError(
      null,
    );
  }

  function addPlatform(
    platform: Platform,
  ) {
    if (
      selectedPlatforms.has(
        platform.id,
      )
    ) {
      return;
    }

    setSocialLinks(
      (current) => [
        ...current,
        createProfileLink(
          profile.id,
          platform.id,
        ),
      ],
    );

    setError(
      null,
    );
  }

  function removePlatform(
    platformId: string,
  ) {
    setSocialLinks(
      (current) =>
        current.filter(
          (link) =>
            link.platform !==
            platformId,
        ),
    );

    setError(
      null,
    );
  }

  function updatePlatform(
    platformId: string,
    value: string,
  ) {
    setSocialLinks(
      (current) =>
        current.map(
          (link) =>
            link.platform ===
            platformId
              ? {
                  ...link,
                  url: value,
                }
              : link,
        ),
    );

    setError(
      null,
    );
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      null,
    );

    const cleanName =
      fullName.trim();

    const cleanProfession =
      profession.trim();

    const cleanBio =
      bio.trim();

    const cleanCity =
      businessCity.trim();

    const cleanProvince =
      businessProvince.trim();

    const cleanWebsite =
      businessWebsite.trim();

    if (
      (
        section === "name" ||
        section === "profile"
      ) &&
      cleanName.length < 2
    ) {
      setError(
        isBusiness
          ? "El nombre comercial debe tener al menos 2 caracteres."
          : "El nombre debe tener al menos 2 caracteres.",
      );

      return;
    }

    if (
      isBusiness &&
      (
        section ===
          "profession" ||
        section ===
          "profile"
      ) &&
      !cleanProfession
    ) {
      setError(
        "Selecciona un sector para tu negocio.",
      );

      return;
    }

    if (
      isBusiness &&
      section === "profile"
    ) {
      if (
        cleanCity.length < 2
      ) {
        setError(
          "Indica la ciudad del negocio.",
        );

        return;
      }

      if (
        cleanProvince.length <
        2
      ) {
        setError(
          "Indica la provincia del negocio.",
        );

        return;
      }

      if (
        !isValidWebsite(
          cleanWebsite,
        )
      ) {
        setError(
          "Introduce un sitio web válido.",
        );

        return;
      }
    }

    if (
      (
        section ===
          "socials" ||
        section ===
          "profile"
      ) &&
      socialLinks.some(
        (link) =>
          !link.url.trim(),
      )
    ) {
      setError(
        "Completa o elimina las redes que todavía estén vacías.",
      );

      return;
    }

    await onSave({
      fullName:
        section === "name" ||
        section === "profile"
          ? cleanName
          : profile.full_name ??
            "",

      profession:
        section ===
          "profession" ||
        section ===
          "profile"
          ? cleanProfession
          : profile.profession ??
            "",

      bio:
        section === "bio" ||
        section === "profile"
          ? cleanBio
          : profile.bio ?? "",

      interests:
        section ===
          "interests" ||
        section ===
          "profile"
          ? interests
          : profile.interests ??
            [],

      socialLinks:
        section ===
          "socials" ||
        section ===
          "profile"
          ? socialLinks
          : links,

      avatarFile,

      businessCity:
        isBusiness
          ? cleanCity
          : "",

      businessProvince:
        isBusiness
          ? cleanProvince
          : "",

      businessWebsite:
        isBusiness
          ? cleanWebsite
          : "",
    });
  }

  const initials =
    getInitials(
      fullName ||
        profile.full_name ||
        profile.username ||
        (
          isBusiness
            ? "Negocio"
            : "Usuario"
        ),
    );

  const showAvatar =
    section === "profile";

  const showName =
    section === "name" ||
    section === "profile";

  const showProfession =
    section ===
      "profession" ||
    section === "profile";

  const showBio =
    section === "bio" ||
    section === "profile";

  const showInterests =
    section ===
      "interests" ||
    section === "profile";

  const showSocials =
    section ===
      "socials" ||
    section === "profile";

  const showBusinessPublicData =
    isBusiness &&
    section === "profile";

  const visibleError =
    error ?? saveError;

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-end
        justify-center
        bg-slate-950/40
        backdrop-blur-sm
        sm:items-center
        sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-editor-title"
    >
      <div
        className="
          flex
          max-h-[94vh]
          w-full
          max-w-lg
          flex-col
          overflow-hidden
          rounded-t-[30px]
          bg-white
          shadow-2xl
          sm:rounded-[30px]
        "
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#EEF0F5] px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#5D5FEF]">
                <Pencil size={14} />
              </div>

              <h2
                id="settings-editor-title"
                className="truncate text-lg font-black text-slate-900"
              >
                {getTitle(
                  section,
                  isBusiness,
                )}
              </h2>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {getDescription(
                section,
                isBusiness,
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6"
        >
          <div className="space-y-6">
            {showAvatar ? (
              <div className="rounded-2xl border border-[#E8EBF2] bg-[#FAFBFD] p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={[
                      "relative h-16 w-16 shrink-0 overflow-hidden bg-[#EEF2FF]",
                      isBusiness
                        ? "rounded-[18px]"
                        : "rounded-full",
                    ].join(" ")}
                  >
                    {previewUrl ? (
                      <Image
                        src={
                          previewUrl
                        }
                        alt="Vista previa"
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized={
                          previewUrl.startsWith(
                            "blob:",
                          )
                        }
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#5D5FEF]">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-800">
                      {isBusiness
                        ? "Logo o imagen"
                        : "Foto de perfil"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG o WebP · máximo 5 MB
                    </p>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleAvatarChange
                      }
                      disabled={
                        saving
                      }
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={
                        saving
                      }
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#5D5FEF] shadow-sm ring-1 ring-[#E3E6F2]"
                    >
                      <Camera size={13} />
                      Cambiar imagen
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showName ? (
              <div>
                <label
                  htmlFor="settings-editor-name"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500"
                >
                  {isBusiness
                    ? "Nombre comercial"
                    : "Nombre"}
                </label>

                <input
                  id="settings-editor-name"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value,
                    )
                  }
                  maxLength={80}
                  disabled={saving}
                  className="w-full rounded-2xl border border-[#E5E8F0] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10"
                />

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Tu nombre de usuario{" "}
                  <strong>
                    @{profile.username}
                  </strong>{" "}
                  no cambiará al modificar este campo.
                </p>
              </div>
            ) : null}

            {showProfession ? (
              <div>
                <label
                  htmlFor="settings-editor-profession"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500"
                >
                  {isBusiness
                    ? "Sector"
                    : "Profesión"}
                </label>

                {isBusiness ? (
                  <div className="relative">
                    <select
                      id="settings-editor-profession"
                      value={
                        profession
                      }
                      onChange={(event) =>
                        setProfession(
                          event.target.value,
                        )
                      }
                      disabled={
                        saving
                      }
                      className="w-full appearance-none rounded-2xl border border-[#E5E8F0] bg-white px-4 py-3 pr-11 text-sm font-semibold text-slate-900 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10"
                    >
                      <option value="">
                        Selecciona un sector
                      </option>

                      {profession &&
                      !currentBusinessSectorExists ? (
                        <option
                          value={
                            profession
                          }
                        >
                          {profession}
                        </option>
                      ) : null}

                      {BUSINESS_SECTORS.map(
                        (sector) => (
                          <option
                            key={
                              sector.id
                            }
                            value={
                              sector.label
                            }
                          >
                            {
                              sector.label
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                ) : (
                  <input
                    id="settings-editor-profession"
                    value={
                      profession
                    }
                    onChange={(event) =>
                      setProfession(
                        event.target.value,
                      )
                    }
                    maxLength={100}
                    disabled={
                      saving
                    }
                    placeholder="Ej. Desarrollador Full Stack"
                    className="w-full rounded-2xl border border-[#E5E8F0] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10"
                  />
                )}
              </div>
            ) : null}

            {showBio ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="settings-editor-bio"
                    className="text-xs font-black uppercase tracking-[0.12em] text-slate-500"
                  >
                    {isBusiness
                      ? "Descripción"
                      : "Biografía"}
                  </label>

                  <span className="text-[10px] font-bold text-slate-400">
                    {bio.length}/300
                  </span>
                </div>

                <textarea
                  id="settings-editor-bio"
                  value={bio}
                  onChange={(event) =>
                    setBio(
                      event.target.value,
                    )
                  }
                  maxLength={300}
                  rows={5}
                  disabled={saving}
                  className="w-full resize-none rounded-2xl border border-[#E5E8F0] px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10"
                />
              </div>
            ) : null}

            {showBusinessPublicData ? (
              <section className="rounded-[24px] border border-[#E8EBF2] bg-[#FAFBFD] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                  UBICACIÓN PÚBLICA
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Solo mostramos ciudad y provincia. Tu dirección exacta no se publica.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="business-city"
                      className="mb-2 block text-xs font-black text-slate-500"
                    >
                      Ciudad
                    </label>

                    <input
                      id="business-city"
                      value={
                        businessCity
                      }
                      onChange={(event) =>
                        setBusinessCity(
                          event.target.value,
                        )
                      }
                      maxLength={120}
                      disabled={saving}
                      className="w-full rounded-2xl border border-[#E5E8F0] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#5D5FEF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business-province"
                      className="mb-2 block text-xs font-black text-slate-500"
                    >
                      Provincia
                    </label>

                    <input
                      id="business-province"
                      value={
                        businessProvince
                      }
                      onChange={(event) =>
                        setBusinessProvince(
                          event.target.value,
                        )
                      }
                      maxLength={120}
                      disabled={saving}
                      className="w-full rounded-2xl border border-[#E5E8F0] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#5D5FEF]"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="business-website"
                    className="mb-2 block text-xs font-black text-slate-500"
                  >
                    Sitio web
                  </label>

                  <input
                    id="business-website"
                    type="text"
                    value={
                      businessWebsite
                    }
                    onChange={(event) =>
                      setBusinessWebsite(
                        event.target.value,
                      )
                    }
                    maxLength={500}
                    disabled={saving}
                    placeholder="https://tuempresa.com"
                    className="w-full rounded-2xl border border-[#E5E8F0] bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#5D5FEF]"
                  />
                </div>
              </section>
            ) : null}

            {showInterests ? (
              <section>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={14}
                        className="text-[#5D5FEF]"
                      />

                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        {isBusiness
                          ? "Temas y categorías"
                          : "Intereses"}
                      </p>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Esto ayudará a LookUp a entender mejor tu relevancia.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-black text-[#5D5FEF]">
                    {interests.length} seleccionados
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(
                    (interest) => {
                      const selected =
                        interests.includes(
                          interest.id,
                        );

                      return (
                        <button
                          key={
                            interest.id
                          }
                          type="button"
                          onClick={() =>
                            toggleInterest(
                              interest.id,
                            )
                          }
                          disabled={saving}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black transition",
                            selected
                              ? "border-[#5D5FEF] bg-[#5D5FEF] text-white"
                              : "border-[#E2E5EE] bg-white text-slate-600 hover:border-[#CBCDFF] hover:text-[#5D5FEF]",
                          ].join(" ")}
                        >
                          {selected ? (
                            <Check size={12} />
                          ) : null}

                          {interest.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </section>
            ) : null}

            {showSocials ? (
              <section>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      Redes sociales
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Selecciona una plataforma y añade únicamente el dato solicitado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPlatformPickerOpen(
                        (current) =>
                          !current,
                      )
                    }
                    disabled={saving}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#EEF2FF] px-3 py-2 text-xs font-black text-[#5D5FEF]"
                  >
                    {platformPickerOpen ? (
                      <X size={13} />
                    ) : (
                      <Plus size={13} />
                    )}

                    {platformPickerOpen
                      ? "Cerrar"
                      : "Añadir"}
                  </button>
                </div>

                {platformPickerOpen ? (
                  <div className="mt-4 rounded-[24px] border border-[#E6E8F1] bg-[#FAFBFD] p-4">
                    <p className="text-xs font-black text-slate-700">
                      Elige una red
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Cada plataforma puede añadirse una sola vez.
                    </p>

                    {selectablePlatforms.length >
                    0 ? (
                      <>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {selectablePlatforms.map(
                            (platform) => (
                              <PlatformCard
                                key={
                                  platform.id
                                }
                                platform={
                                  platform.id
                                }
                                label={
                                  platform.name
                                }
                                selected={
                                  false
                                }
                                onClick={() =>
                                  addPlatform(
                                    platform,
                                  )
                                }
                              />
                            ),
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowAllPlatforms(
                              (current) =>
                                !current,
                            )
                          }
                          className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-black text-[#5D5FEF]"
                        >
                          {showAllPlatforms ? (
                            <>
                              <ChevronUp size={14} />
                              Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              Ver todas
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <p className="mt-4 rounded-2xl bg-white px-4 py-4 text-center text-xs font-semibold text-slate-400">
                        Ya has añadido todas las redes disponibles.
                      </p>
                    )}
                  </div>
                ) : null}

                {socialLinks.length >
                0 ? (
                  <div className="mt-4 space-y-3">
                    {socialLinks.map(
                      (link) => {
                        const platform =
                          SOCIAL_PLATFORMS.find(
                            (item) =>
                              item.id ===
                              link.platform,
                          );

                        if (!platform) {
                          return null;
                        }

                        return (
                          <div
                            key={link.id}
                            className="rounded-[22px] border border-[#E8EBF2] bg-[#FAFBFD] p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#5D5FEF]">
                                <SocialIcon
                                  platform={
                                    platform.id
                                  }
                                  size={18}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-800">
                                  {
                                    platform.name
                                  }
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                  {platform.prefix ||
                                    "Enlace personalizado"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removePlatform(
                                    platform.id,
                                  )
                                }
                                disabled={saving}
                                aria-label={`Eliminar ${platform.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                              {getInputLabel(
                                platform,
                              )}
                            </label>

                            <input
                              type={
                                platform.type ===
                                "phone"
                                  ? "tel"
                                  : "text"
                              }
                              value={
                                link.url
                              }
                              onChange={(event) =>
                                updatePlatform(
                                  platform.id,
                                  event.target.value,
                                )
                              }
                              placeholder={
                                platform.placeholder
                              }
                              disabled={saving}
                              className="mt-2 w-full rounded-xl border border-[#E5E8F0] bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#5D5FEF]"
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#DDE2EC] bg-[#FAFBFD] px-4 py-5 text-center">
                    <p className="text-xs font-semibold text-slate-400">
                      Aún no has conectado ninguna red.
                    </p>
                  </div>
                )}
              </section>
            ) : null}

            {visibleError ? (
              <div
                role="alert"
                className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-600"
              >
                {visibleError}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3 border-t border-[#EEF0F5] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-2xl border border-[#E3E6EE] px-4 py-3 text-sm font-black text-slate-600"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#5153E6] disabled:opacity-50"
            >
              {saving ? (
                "Guardando..."
              ) : (
                <>
                  <Check size={16} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}