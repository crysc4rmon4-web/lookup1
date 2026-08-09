"use client";

import Image from "next/image";
import {
    Camera,
    Check,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type {
    ProfileLink,
    ProfileRow,
} from "@lookup/services";

import type {
    SettingsEditSection,
} from "./SettingsView";

export type SettingsProfileEditorData = {
    fullName: string;
    profession: string;
    bio: string;
    socialLinks: ProfileLink[];
    avatarFile: File | null;
};

type SettingsProfileEditorProps = {
    profile: ProfileRow;
    links: ProfileLink[];
    section: SettingsEditSection;
    saving: boolean;
    onSave: (
        data: SettingsProfileEditorData,
    ) => void | Promise<void>;
    onClose: () => void;
};

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            (part) =>
                part[0]?.toUpperCase() ?? "",
        )
        .join("");
}

function formatPlatform(platform: string) {
    return platform
        .replace(/[_-]/g, " ")
        .trim()
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase(),
        );
}

function getTitle(
    section: SettingsEditSection,
) {
    switch (section) {
        case "name":
            return "Editar nombre";

        case "profession":
            return "Editar profesión";

        case "bio":
            return "Editar biografía";

        case "socials":
            return "Editar redes sociales";

        case "profile":
        default:
            return "Editar perfil";
    }
}

function getDescription(
    section: SettingsEditSection,
) {
    switch (section) {
        case "name":
            return "Actualiza el nombre que verán las personas en LookUp.";

        case "profession":
            return "Indica a qué te dedicas para que tu perfil sea más claro.";

        case "bio":
            return "Cuenta brevemente quién eres y qué buscas.";

        case "socials":
            return "Añade las redes que quieras compartir con otras personas.";

        case "profile":
        default:
            return "Actualiza la información principal de tu perfil.";
    }
}


export function SettingsProfileEditor({
    profile,
    links,
    section,
    saving,
    onSave,
    onClose,
}: SettingsProfileEditorProps) {
    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const [fullName, setFullName] =
        useState(profile.full_name ?? "");

    const [profession, setProfession] =
        useState(profile.profession ?? "");

    const [bio, setBio] =
        useState(profile.bio ?? "");

    const [socialLinks, setSocialLinks] =
        useState<ProfileLink[]>(links);

    const [avatarFile, setAvatarFile] =
        useState<File | null>(null);

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(
            profile.avatar_url ?? null,
        );

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleAvatarChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError(
                "Selecciona un archivo de imagen válido.",
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(
                "La imagen no puede superar los 5 MB.",
            );

            return;
        }

        if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }

        const nextPreview =
            URL.createObjectURL(file);

        setAvatarFile(file);
        setPreviewUrl(nextPreview);
        setError(null);
    }

    function handleSocialChange(
        index: number,
        field: "platform" | "url",
        value: string,
    ) {
        setSocialLinks((current) =>
            current.map((link, linkIndex) =>
                linkIndex === index
                    ? {
                        ...link,
                        [field]: value,
                    }
                    : link,
            ),
        );

        setError(null);
    }

    function handleAddSocial() {
        setSocialLinks((current) => [
            ...current,
            {
                id: `new-${Date.now()}`,
                profile_id: profile.id,
                platform: "",
                url: "",
            } as ProfileLink,
        ]);
    }

    function handleRemoveSocial(
        index: number,
    ) {
        setSocialLinks((current) =>
            current.filter(
                (_, linkIndex) =>
                    linkIndex !== index,
            ),
        );
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);

        const cleanName =
            fullName.trim();

        const cleanProfession =
            profession.trim();

        const cleanBio =
            bio.trim();

        if (
            (section === "name" ||
                section === "profile") &&
            cleanName.length < 2
        ) {
            setError(
                "El nombre debe tener al menos 2 caracteres.",
            );

            return;
        }

        if (
            (section === "socials" ||
                section === "profile") &&
            socialLinks.some(
                (link) =>
                    link.platform.trim() &&
                    !link.url.trim(),
            )
        ) {
            setError(
                "Completa la dirección de todas las redes que hayas empezado a añadir.",
            );

            return;
        }

        const cleanSocialLinks =
            socialLinks.filter(
                (link) =>
                    link.platform.trim() &&
                    link.url.trim(),
            );

        await onSave({
            fullName:
                section === "name" ||
                    section === "profile"
                    ? cleanName
                    : profile.full_name ?? "",
            profession:
                section === "profession" ||
                    section === "profile"
                    ? cleanProfession
                    : profile.profession ?? "",
            bio:
                section === "bio" ||
                    section === "profile"
                    ? cleanBio
                    : profile.bio ?? "",
            socialLinks:
                section === "socials" ||
                    section === "profile"
                    ? cleanSocialLinks
                    : links,
            avatarFile,
        });
    }

    const initials = getInitials(
        fullName ||
        profile.full_name ||
        profile.username ||
        "Usuario",
    );

    const showAvatar =
        section === "profile";

    const showName =
        section === "name" ||
        section === "profile";

    const showProfession =
        section === "profession" ||
        section === "profile";

    const showBio =
        section === "bio" ||
        section === "profile";

    const showSocials =
        section === "socials" ||
        section === "profile";

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
        p-0
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
          max-h-[92vh]
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
                {/* Header */}
                <div
                    className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-[#EEF0F5]
            px-5
            py-4
            sm:px-6
          "
                >
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div
                                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EEF2FF]
                  text-[#5D5FEF]
                "
                            >
                                <Pencil size={14} />
                            </div>

                            <h2
                                id="settings-editor-title"
                                className="
                  truncate
                  text-lg
                  font-black
                  text-slate-900
                "
                            >
                                {getTitle(section)}
                            </h2>
                        </div>

                        <p
                            className="
                mt-1
                text-xs
                leading-5
                text-slate-500
              "
                        >
                            {getDescription(section)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Cerrar"
                        className="
              ml-3
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-500
              transition
              hover:bg-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Content */}
                <form
                    onSubmit={handleSubmit}
                    className="
            min-h-0
            overflow-y-auto
            px-5
            py-5
            sm:px-6
          "
                >
                    <div className="space-y-5">
                        {/* Avatar */}
                        {showAvatar && (
                            <div
                                className="
                  rounded-2xl
                  border
                  border-[#E8EBF2]
                  bg-[#FAFBFD]
                  p-4
                "
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="
                      relative
                      h-16
                      w-16
                      shrink-0
                      overflow-hidden
                      rounded-full
                      bg-[#EEF2FF]
                    "
                                    >
                                        {previewUrl ? (
                                            <Image
                                                src={previewUrl}
                                                alt="Vista previa de foto de perfil"
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                                unoptimized={previewUrl.startsWith(
                                                    "blob:",
                                                )}
                                            />
                                        ) : (
                                            <div
                                                className="
                          flex
                          h-full
                          w-full
                          items-center
                          justify-center
                          text-lg
                          font-black
                          text-[#5D5FEF]
                        "
                                            >
                                                {initials}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-slate-800">
                                            Foto de perfil
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-slate-500">
                                            JPG, PNG o WebP · máximo 5 MB
                                        </p>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            disabled={saving}
                                            className="hidden"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={saving}
                                            className="
                        mt-2
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-white
                        px-3
                        py-2
                        text-xs
                        font-black
                        text-[#5D5FEF]
                        shadow-sm
                        ring-1
                        ring-[#E3E6F2]
                        transition
                        hover:bg-[#F7F7FF]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                                        >
                                            <Camera size={13} />
                                            Cambiar foto
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Nombre */}
                        {showName && (
                            <div>
                                <label
                                    htmlFor="settings-editor-name"
                                    className="
                    mb-2
                    block
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-slate-500
                  "
                                >
                                    Nombre
                                </label>

                                <input
                                    id="settings-editor-name"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(
                                            event.target.value,
                                        )
                                    }
                                    maxLength={80}
                                    autoComplete="name"
                                    disabled={saving}
                                    className="
                    w-full
                    rounded-2xl
                    border
                    border-[#E5E8F0]
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-300
                    focus:border-[#5D5FEF]
                    focus:ring-4
                    focus:ring-[#5D5FEF]/10
                    disabled:bg-slate-50
                  "
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    Tu usuario se mantendrá sincronizado con
                                    el nombre cuando sea necesario.
                                </p>
                            </div>
                        )}

                        {/* Profesión */}
                        {showProfession && (
                            <div>
                                <label
                                    htmlFor="settings-editor-profession"
                                    className="
                    mb-2
                    block
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-slate-500
                  "
                                >
                                    Profesión
                                </label>

                                <input
                                    id="settings-editor-profession"
                                    type="text"
                                    value={profession}
                                    onChange={(event) =>
                                        setProfession(
                                            event.target.value,
                                        )
                                    }
                                    maxLength={100}
                                    autoComplete="organization-title"
                                    placeholder="Ej. Desarrollador Full Stack"
                                    disabled={saving}
                                    className="
                    w-full
                    rounded-2xl
                    border
                    border-[#E5E8F0]
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-300
                    focus:border-[#5D5FEF]
                    focus:ring-4
                    focus:ring-[#5D5FEF]/10
                    disabled:bg-slate-50
                  "
                                />
                            </div>
                        )}

                        {/* Bio */}
                        {showBio && (
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="settings-editor-bio"
                                        className="
                      text-xs
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-slate-500
                    "
                                    >
                                        Biografía
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
                                    placeholder="Cuéntale a la comunidad un poco sobre ti..."
                                    disabled={saving}
                                    className="
                    w-full
                    resize-none
                    rounded-2xl
                    border
                    border-[#E5E8F0]
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    leading-6
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-300
                    focus:border-[#5D5FEF]
                    focus:ring-4
                    focus:ring-[#5D5FEF]/10
                    disabled:bg-slate-50
                  "
                                />
                            </div>
                        )}

                        {/* Redes */}
                        {showSocials && (
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <label
                                            className="
                        text-xs
                        font-black
                        uppercase
                        tracking-[0.12em]
                        text-slate-500
                      "
                                        >
                                            Redes sociales
                                        </label>

                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            Añade solo las que quieras mostrar.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddSocial}
                                        disabled={saving}
                                        className="
                      inline-flex
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-xl
                      bg-[#EEF2FF]
                      px-3
                      py-2
                      text-xs
                      font-black
                      text-[#5D5FEF]
                      transition
                      hover:bg-[#E5E7FF]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                                    >
                                        <Plus size={13} />
                                        Añadir
                                    </button>
                                </div>

                                {socialLinks.length === 0 ? (
                                    <div
                                        className="
                      mt-3
                      rounded-2xl
                      border
                      border-dashed
                      border-[#DDE2EC]
                      bg-[#FAFBFD]
                      px-4
                      py-5
                      text-center
                    "
                                    >
                                        <p className="text-xs font-semibold text-slate-400">
                                            Todavía no tienes redes añadidas.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-3 space-y-3">
                                        {socialLinks.map(
                                            (link, index) => (
                                                <div
                                                    key={
                                                        link.id ??
                                                        `social-${index}`
                                                    }
                                                    className="
                            rounded-2xl
                            border
                            border-[#E8EBF2]
                            bg-[#FAFBFD]
                            p-3
                          "
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={
                                                                link.platform
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                handleSocialChange(
                                                                    index,
                                                                    "platform",
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Instagram"
                                                            maxLength={30}
                                                            disabled={saving}
                                                            className="
                                min-w-0
                                flex-1
                                rounded-xl
                                border
                                border-[#E5E8F0]
                                bg-white
                                px-3
                                py-2.5
                                text-xs
                                font-bold
                                text-slate-800
                                outline-none
                                focus:border-[#5D5FEF]
                                focus:ring-4
                                focus:ring-[#5D5FEF]/10
                              "
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveSocial(
                                                                    index,
                                                                )
                                                            }
                                                            disabled={saving}
                                                            aria-label={`Eliminar ${formatPlatform(
                                                                link.platform ||
                                                                "red social",
                                                            )}`}
                                                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                text-slate-400
                                transition
                                hover:bg-red-50
                                hover:text-red-500
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="url"
                                                        value={link.url}
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            handleSocialChange(
                                                                index,
                                                                "url",
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="https://..."
                                                        maxLength={255}
                                                        disabled={saving}
                                                        className="
                              mt-2
                              w-full
                              rounded-xl
                              border
                              border-[#E5E8F0]
                              bg-white
                              px-3
                              py-2.5
                              text-xs
                              font-semibold
                              text-slate-800
                              outline-none
                              focus:border-[#5D5FEF]
                              focus:ring-4
                              focus:ring-[#5D5FEF]/10
                            "
                                                    />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div
                                role="alert"
                                className="
                  rounded-2xl
                  bg-red-50
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  leading-5
                  text-red-600
                "
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div
                        className="
              mt-6
              flex
              gap-3
              border-t
              border-[#EEF0F5]
              pt-5
            "
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="
                flex-1
                rounded-2xl
                border
                border-[#E3E6EE]
                px-4
                py-3
                text-sm
                font-black
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#5D5FEF]
                px-4
                py-3
                text-sm
                font-black
                text-white
                shadow-sm
                transition
                hover:bg-[#5153E6]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
                        >
                            {saving ? (
                                "Guardando..."
                            ) : (
                                <>
                                    <Check size={16} />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}