"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { saveMyProfile } from "@lookup/services";
import {
  isValidUsername,
  normalizeFullName,
  normalizeHandle,
  normalizeUsername,
} from "@lookup/utils";

import { useProfileStatus } from "../../hooks/use-profile-status";

type FieldErrors = {
  fullName?: string;
  username?: string;
  avatarUrl?: string;
};

type FeedbackType = {
  type: "success" | "error" | "info" | null;
  message: string;
};

type SocialOption = {
  id: string;
  label: string;
  placeholder: string;
  icon: string;
};

const SOCIAL_OPTIONS: SocialOption[] = [
  { id: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/tu-perfil", icon: "in" },
  { id: "tiktok", label: "TikTok", placeholder: "@tuusuario", icon: "♪" },
  { id: "youtube", label: "YouTube", placeholder: "youtube.com/@tuusuario", icon: "▶" },
  { id: "github", label: "GitHub", placeholder: "github.com/tuusuario", icon: "{}" },
  { id: "facebook", label: "Facebook", placeholder: "facebook.com/tuusuario", icon: "f" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "+34 600 000 000", icon: "wa" },
  { id: "behance", label: "Behance", placeholder: "behance.net/tuusuario", icon: "Bē" },
  { id: "dribbble", label: "Dribbble", placeholder: "dribbble.com/tuusuario", icon: "D" },
  { id: "threads", label: "Threads", placeholder: "@tuusuario", icon: "@" },
  { id: "telegram", label: "Telegram", placeholder: "@tuusuario", icon: "tg" },
];

export default function OnboardingPage() {
  const router = useRouter();

  const { user, profile, loading } = useProfileStatus();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [visibility, setVisibility] = useState(true);

  const [selectedSocials, setSelectedSocials] = useState<string[]>([]);
  const [socialValues, setSocialValues] = useState<Record<string, string>>({});
  const [socialToAdd, setSocialToAdd] = useState<string>("linkedin");

  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackType>({
    type: "info",
    message: "Puedes completar tu perfil ahora o continuar sin terminarlo.",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const cleanFullName = useMemo(() => normalizeFullName(fullName), [fullName]);
  const cleanUsername = useMemo(() => normalizeUsername(username), [username]);
  const cleanInstagram = useMemo(() => normalizeHandle(instagram), [instagram]);
  const cleanTwitter = useMemo(() => normalizeHandle(twitter), [twitter]);
  const cleanAvatarUrl = useMemo(() => avatarUrl.trim(), [avatarUrl]);

  const completionPercent = useMemo(() => {
    const checkpoints = [
      Boolean(cleanFullName.trim()),
      Boolean(cleanUsername.trim()),
      Boolean(profession.trim()),
      Boolean(city.trim()),
      Boolean(bio.trim()),
      Boolean(cleanAvatarUrl.trim()),
      Boolean(cleanInstagram.trim()),
      Boolean(cleanTwitter.trim()),
      selectedSocials.length > 0,
    ];

    return Math.round(
      (checkpoints.filter(Boolean).length / checkpoints.length) * 100,
    );
  }, [
    bio,
    city,
    cleanAvatarUrl,
    cleanFullName,
    cleanInstagram,
    cleanTwitter,
    cleanUsername,
    profession,
    selectedSocials.length,
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login/signup");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    const nextFullName =
      profile?.full_name ?? user.user_metadata?.full_name ?? "";
    const nextUsername = profile?.username ?? "";
    const nextProfession = profile?.profession ?? "";
    const nextCity = profile?.city ?? "";
    const nextBio = profile?.bio ?? "";
    const nextInstagram = profile?.instagram ?? "";
    const nextTwitter = profile?.twitter ?? "";
    const nextAvatarUrl = profile?.avatar_url ?? "";
    const nextVisibility = profile?.visibility ?? true;

    setFullName(nextFullName);
    setUsername(nextUsername);
    setProfession(nextProfession);
    setCity(nextCity);
    setBio(nextBio);
    setInstagram(nextInstagram);
    setTwitter(nextTwitter);
    setAvatarUrl(nextAvatarUrl);
    setVisibility(nextVisibility);
  }, [profile, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const storageKey = `lookup:onboarding:socials:${user.id}`;
    const savedValue = window.localStorage.getItem(storageKey);

    if (savedValue) {
      try {
        const parsed = JSON.parse(savedValue) as {
          selectedSocials?: string[];
          socialValues?: Record<string, string>;
        };

        const cleanedSelected = Array.isArray(parsed.selectedSocials)
          ? parsed.selectedSocials.filter((value) =>
            SOCIAL_OPTIONS.some((option) => option.id === value),
          )
          : [];

        setSelectedSocials(cleanedSelected);

        setSocialValues(
          typeof parsed.socialValues === "object" && parsed.socialValues
            ? parsed.socialValues
            : {},
        );

        return;
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    const defaults: string[] = [];
    if (profile?.instagram) defaults.push("instagram");
    if (profile?.twitter) defaults.push("twitter");

    setSelectedSocials(defaults);
    setSocialValues({
      instagram: profile?.instagram ?? "",
      twitter: profile?.twitter ?? "",
    });
  }, [profile?.instagram, profile?.twitter, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const storageKey = `lookup:onboarding:socials:${user.id}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        selectedSocials,
        socialValues,
      }),
    );
  }, [selectedSocials, socialValues, user]);

  function clearFieldError<K extends keyof FieldErrors>(key: K) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function getInputClasses(hasError: boolean) {
    return `
      h-[60px]
      w-full
      rounded-[1.5rem]
      border
      bg-white
      px-5
      text-[0.95rem]
      font-semibold
      text-slate-900
      outline-none
      transition-all
      placeholder:text-slate-400
      focus:bg-white
      ${hasError
        ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.10)]"
        : "border-slate-200 focus:border-[#5D5FEF]"
      }
    `;
  }

  function getTextAreaClasses(hasError: boolean) {
    return `
      min-h-[120px]
      w-full
      rounded-[1.5rem]
      border
      bg-white
      px-5
      py-4
      text-[0.95rem]
      font-semibold
      text-slate-900
      outline-none
      transition-all
      placeholder:text-slate-400
      resize-none
      ${hasError
        ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.10)]"
        : "border-slate-200 focus:border-[#5D5FEF]"
      }
    `;
  }

  function addSocial() {
    if (!socialToAdd) return;
    if (selectedSocials.includes(socialToAdd)) return;

    setSelectedSocials((current) => [...current, socialToAdd]);
    setSocialValues((current) => ({
      ...current,
      [socialToAdd]: current[socialToAdd] ?? "",
    }));

    const nextOption =
      SOCIAL_OPTIONS.find((option) => !selectedSocials.includes(option.id))
        ?.id ?? "";

    setSocialToAdd(nextOption);
  }

  function removeSocial(id: string) {
    setSelectedSocials((current) => current.filter((item) => item !== id));
    setSocialValues((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving || loading || !user) return;

    setFieldErrors({});

    const errors: FieldErrors = {};

    if (cleanFullName && cleanFullName.split(" ").length < 2) {
      errors.fullName = "Introduce nombre y apellido completos";
    }

    if (username.trim() && !isValidUsername(cleanUsername)) {
      errors.username =
        "Usa 3-20 caracteres: letras, números, punto o guion bajo";
    }

    if (cleanAvatarUrl) {
      try {
        new URL(cleanAvatarUrl);
      } catch {
        errors.avatarUrl = "Introduce una URL válida";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({
        type: "error",
        message: "Revisa los campos marcados.",
      });
      return;
    }

    setSaving(true);
    setFeedback({
      type: "info",
      message: "Guardando tu perfil...",
    });

    try {
      const { error } = await saveMyProfile({
        id: user.id,
        email: user.email ?? null,
        full_name: cleanFullName || null,
        username: cleanUsername || null,
        profession: profession.trim() || null,
        city: city.trim() || null,
        bio: bio.trim() || null,
        avatar_url: cleanAvatarUrl || null,
        instagram: cleanInstagram || null,
        twitter: cleanTwitter || null,
        visibility,
        onboarding_completed: completionPercent === 100,
      });

      if (error) {
        setFeedback({
          type: "error",
          message: error.message,
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "Perfil guardado. Volviendo al dashboard...",
      });

      router.replace("/dashboard");
    } catch {
      setFeedback({
        type: "error",
        message: "No se pudo guardar el perfil. Inténtalo de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-500">Cargando perfil...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const availableSocials = SOCIAL_OPTIONS.filter(
    (option) =>
      !selectedSocials.includes(option.id) &&
      !(option.id === "instagram" && cleanInstagram) &&
      !(option.id === "twitter" && cleanTwitter),
  );

  const selectedOptionLabels = selectedSocials
    .map(
      (id) =>
        SOCIAL_OPTIONS.find((option) => option.id === id)?.label ?? id,
    )
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 pb-24">
      <section className="mx-auto w-full max-w-[430px]">
        <header className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            LookUp
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            {profile?.onboarding_completed
              ? "Editar perfil"
              : "Completa tu perfil"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Este perfil alimenta tu visibilidad en el radar y tu ficha pública.
          </p>

          <div className="mt-4 rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Progreso
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {completionPercent}%
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-500 shadow-sm"
              >
                Continuar
              </button>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-[#5D5FEF] transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Puedes guardar solo lo que tengas listo y volver cuando quieras.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("fullName");
              }}
              disabled={saving}
              autoComplete="name"
              className={getInputClasses(!!fieldErrors.fullName)}
            />
            {fieldErrors.fullName ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.fullName}
              </p>
            ) : null}
          </div>

          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              disabled={saving}
              autoComplete="username"
              className={getInputClasses(!!fieldErrors.username)}
            />
            {fieldErrors.username ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div>
            <input
              type="text"
              placeholder="Profesión"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              disabled={saving}
              className={getInputClasses(false)}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ciudad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={saving}
              className={getInputClasses(false)}
            />
          </div>

          <div>
            <textarea
              placeholder="Bio corta"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              className={getTextAreaClasses(false)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input
                type="text"
                placeholder="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={saving}
                className={getInputClasses(false)}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Twitter / X"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                disabled={saving}
                className={getInputClasses(false)}
              />
            </div>
          </div>

          <div>
            <input
              type="url"
              placeholder="URL de avatar"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                clearFieldError("avatarUrl");
              }}
              disabled={saving}
              className={getInputClasses(!!fieldErrors.avatarUrl)}
            />
            {fieldErrors.avatarUrl ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.avatarUrl}
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Redes sociales
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Añade las que quieras. No son obligatorias.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <select
                value={socialToAdd}
                onChange={(e) => setSocialToAdd(e.target.value)}
                disabled={saving || availableSocials.length === 0}
                className="h-[52px] flex-1 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none"
              >
                {availableSocials.length === 0 ? (
                  <option value="">Todas añadidas</option>
                ) : (
                  availableSocials.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={addSocial}
                disabled={saving || availableSocials.length === 0}
                className="h-[52px] rounded-[1.25rem] bg-[#5D5FEF] px-4 text-sm font-black text-white transition hover:bg-[#5153e6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Añadir
              </button>
            </div>

            {selectedOptionLabels.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedOptionLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#5D5FEF]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}

            {selectedSocials.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedSocials.map((id) => {
                  const option =
                    SOCIAL_OPTIONS.find((item) => item.id === id) ?? null;

                  if (!option) return null;

                  const value = socialValues[id] ?? "";

                  return (
                    <div
                      key={id}
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-slate-400">
                            {option.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {option.placeholder}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSocial(id)}
                          className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-red-500 shadow-sm"
                        >
                          Quitar
                        </button>
                      </div>

                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setSocialValues((current) => ({
                            ...current,
                            [id]: e.target.value,
                          }))
                        }
                        disabled={saving}
                        placeholder={`Tu ${option.label.toLowerCase()}`}
                        className="mt-3 h-[52px] w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <label className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
            <span className="text-sm font-semibold text-slate-800">
              Perfil visible
            </span>
            <input
              type="checkbox"
              checked={visibility}
              onChange={(e) => setVisibility(e.target.checked)}
              disabled={saving}
              className="h-5 w-5 accent-[#5D5FEF]"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="h-[60px] w-full rounded-[1.5rem] bg-[#5D5FEF] text-[1rem] font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.22)] transition hover:bg-[#5153e6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "GUARDANDO..." : "GUARDAR Y CONTINUAR"}
          </button>

          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            disabled={saving}
            className="h-[60px] w-full rounded-[1.5rem] border border-slate-200 bg-white text-[1rem] font-black uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continuar sin guardar
          </button>

          {feedback.message ? (
            <p
              className={`text-center text-sm font-medium ${feedback.type === "error"
                  ? "text-red-500"
                  : feedback.type === "success"
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
            >
              {feedback.message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}