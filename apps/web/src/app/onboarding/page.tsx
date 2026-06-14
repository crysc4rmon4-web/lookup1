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
  profession?: string;
  city?: string;
  avatarUrl?: string;
};

type FeedbackType = {
  type: "success" | "error" | "info" | null;
  message: string;
};

export default function OnboardingPage() {
  const router = useRouter();

  const {
    user,
    profile,
    loading,
    needsOnboarding,
  } = useProfileStatus();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [visibility, setVisibility] = useState(true);

  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackType>({
      type: "info",
      message: "Completa tu perfil para aparecer en el radar.",
    });

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const cleanFullName = useMemo(
    () => normalizeFullName(fullName),
    [fullName],
  );

  const cleanUsername = useMemo(
    () => normalizeUsername(username),
    [username],
  );

  const cleanInstagram = useMemo(
    () => normalizeHandle(instagram),
    [instagram],
  );

  const cleanTwitter = useMemo(
    () => normalizeHandle(twitter),
    [twitter],
  );

  const cleanAvatarUrl = useMemo(
    () => avatarUrl.trim(),
    [avatarUrl],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login/signup");
      return;
    }

    if (!loading && user && profile?.onboarding_completed) {
      router.replace("/dashboard");
    }
  }, [loading, profile?.onboarding_completed, router, user]);

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
      ${
        hasError
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
      ${
        hasError
          ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.10)]"
          : "border-slate-200 focus:border-[#5D5FEF]"
      }
    `;
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    if (saving || loading || !user) return;

    setFieldErrors({});
    setFeedback({
      type: "info",
      message: "Guardando tu perfil...",
    });

    const errors: FieldErrors = {};

    if (!cleanFullName) {
      errors.fullName = "Introduce nombre y apellido";
    } else if (cleanFullName.split(" ").length < 2) {
      errors.fullName = "Introduce nombre y apellido completos";
    }

    if (!isValidUsername(cleanUsername)) {
      errors.username =
        "Usa 3-20 caracteres: letras, números, punto o guion bajo";
    }

    if (!profession.trim()) {
      errors.profession = "Introduce tu profesión";
    }

    if (!city.trim()) {
      errors.city = "Introduce tu ciudad";
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

    try {
      const { error } = await saveMyProfile({
        id: user.id,
        email: user.email ?? null,
        full_name: cleanFullName,
        username: cleanUsername,
        profession: profession.trim(),
        city: city.trim(),
        bio: bio.trim() || null,
        avatar_url: cleanAvatarUrl || null,
        instagram: cleanInstagram || null,
        twitter: cleanTwitter || null,
        visibility,
        onboarding_completed: true,
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
        message: "Perfil guardado. Entrando al dashboard...",
      });

      router.replace("/dashboard");
    } catch {
      setFeedback({
        type: "error",
        message:
          "No se pudo guardar el perfil. Inténtalo de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-500">
          Cargando perfil...
        </p>
      </main>
    );
  }

  if (!user || !needsOnboarding) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto w-full max-w-[420px]">
        <header className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            LookUp
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Completa tu perfil
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Este perfil alimenta tu visibilidad en el radar y tu ficha pública.
          </p>
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
              onChange={(e) => {
                setProfession(e.target.value);
                clearFieldError("profession");
              }}
              disabled={saving}
              className={getInputClasses(!!fieldErrors.profession)}
            />
            {fieldErrors.profession ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.profession}
              </p>
            ) : null}
          </div>

          <div>
            <input
              type="text"
              placeholder="Ciudad"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearFieldError("city");
              }}
              disabled={saving}
              className={getInputClasses(!!fieldErrors.city)}
            />
            {fieldErrors.city ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.city}
              </p>
            ) : null}
          </div>

          <div>
            <textarea
              placeholder="Bio corta"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
              }}
              disabled={saving}
              className={getTextAreaClasses(false)}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Instagram"
              value={instagram}
              onChange={(e) => {
                setInstagram(e.target.value);
              }}
              disabled={saving}
              className={getInputClasses(false)}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Twitter / X"
              value={twitter}
              onChange={(e) => {
                setTwitter(e.target.value);
              }}
              disabled={saving}
              className={getInputClasses(false)}
            />
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

          {feedback.message ? (
            <p
              className={`text-center text-sm font-medium ${
                feedback.type === "error"
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