"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BottomNav } from "../../components/bottom-nav";
import { RadarCard } from "../../components/radar-card";
import { featuredEvents, nearbyPeople } from "../../data/mock-radar";
import { useAuth } from "../../components/auth-provider";
import { useProfileStatus } from "../../hooks/use-profile-status";

type Section = "radar" | "events" | "settings";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCompletionPercent({
  fullName,
  username,
  profession,
  city,
  bio,
  avatarUrl,
  instagram,
  twitter,
}: {
  fullName: string;
  username: string;
  profession: string;
  city: string;
  bio: string;
  avatarUrl: string;
  instagram: string;
  twitter: string;
}) {
  const checks = [
    Boolean(fullName.trim()),
    Boolean(username.trim()),
    Boolean(profession.trim()),
    Boolean(city.trim()),
    Boolean(bio.trim()),
    Boolean(avatarUrl.trim()),
    Boolean(instagram.trim()),
    Boolean(twitter.trim()),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function DashboardPage() {
  const router = useRouter();

  const { signOut } = useAuth();
  const { user, profile, loading, needsOnboarding } = useProfileStatus();

  const [activeSection, setActiveSection] = useState<Section>("radar");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [profileVisible, setProfileVisible] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login/signup");
    }
  }, [loading, router, user]);

  const displayName = useMemo(() => {
    return (
      profile?.full_name ?? user?.user_metadata?.full_name ?? "LookUp user"
    );
  }, [profile?.full_name, user?.user_metadata?.full_name]);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const profileCompletion = useMemo(() => {
    return getCompletionPercent({
      fullName: profile?.full_name ?? user?.user_metadata?.full_name ?? "",
      username: profile?.username ?? "",
      profession: profile?.profession ?? "",
      city: profile?.city ?? "",
      bio: profile?.bio ?? "",
      avatarUrl: profile?.avatar_url ?? "",
      instagram: profile?.instagram ?? "",
      twitter: profile?.twitter ?? "",
    });
  }, [
    profile?.avatar_url,
    profile?.bio,
    profile?.city,
    profile?.full_name,
    profile?.instagram,
    profile?.profession,
    profile?.twitter,
    profile?.username,
    user?.user_metadata?.full_name,
  ]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;

    const storageKey = `lookup:profile-visible:${user.id}`;
    const saved = window.localStorage.getItem(storageKey);

    if (saved !== null) {
      setProfileVisible(saved === "true");
      return;
    }

    const initialVisible = profile?.visibility ?? true;
    setProfileVisible(initialVisible);
    window.localStorage.setItem(storageKey, String(initialVisible));
  }, [profile?.visibility, user?.id]);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;

    const storageKey = `lookup:profile-visible:${user.id}`;
    window.localStorage.setItem(storageKey, String(profileVisible));
  }, [profileVisible, user?.id]);

  const currentPerson = nearbyPeople[selectedIndex] ?? nearbyPeople[0] ?? null;

  function handleSkip() {
    if (!currentPerson) return;

    const nextIndex = (selectedIndex + 1) % nearbyPeople.length;
    setSelectedIndex(nextIndex);
    setLastAction(`Has saltado a ${currentPerson.name}.`);
  }

  function handleConnect() {
    if (!currentPerson) return;

    const nextIndex = (selectedIndex + 1) % nearbyPeople.length;
    setSelectedIndex(nextIndex);
    setLastAction(`Conexión enviada a ${currentPerson.name}.`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-500">Cargando sesión...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentPerson) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-500">
          No hay personas disponibles.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-4 pb-28">
      <section className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        {needsOnboarding ? (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-amber-700">
                  Perfil pendiente de completar
                </p>
                <p className="mt-1 text-sm text-amber-700/80">
                  Vas por {profileCompletion}%.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-amber-600"
              >
                Completar
              </button>
            </div>

            <div className="mt-3 h-2 rounded-full bg-amber-100">
              <div
                className="h-2 rounded-full bg-amber-500 transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        ) : null}

        <header className="rounded-[2rem] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-400">
                LookUp
              </p>
              <h1 className="mt-1 text-[2rem] font-black italic tracking-[-0.04em] text-[#5D5FEF]">
                {activeSection === "radar"
                  ? "Radar"
                  : activeSection === "events"
                    ? "Actividades"
                    : "Configuración"}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setProfileVisible((current) => !current)}
              className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-600"
            >
              <span>{profileVisible ? "VISIBLE" : "OCULTO"}</span>
              <span
                className={`h-5 w-9 rounded-full p-1 transition ${profileVisible ? "bg-emerald-500" : "bg-slate-300"
                  }`}
              >
                <span
                  className={`block h-3 w-3 rounded-full bg-white transition ${profileVisible ? "translate-x-4" : "translate-x-0"
                    }`}
                />
              </span>
            </button>
          </div>
        </header>

        {activeSection === "radar" ? (
          <div className="rounded-[2rem] bg-white p-4 shadow-sm">
            <div className="rounded-[2rem] border border-slate-100 bg-[linear-gradient(180deg,#fbfcff_0%,#edf1ff_100%)] p-4">
              <div className="relative h-[300px] overflow-hidden rounded-[1.75rem] border border-white/70 bg-[radial-gradient(circle_at_center,_rgba(93,95,239,0.08)_0,_rgba(93,95,239,0.03)_35%,_rgba(255,255,255,0.82)_100%)]">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(#dfe6f8 1px, transparent 1px), linear-gradient(90deg, #dfe6f8 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                />

                <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5D5FEF]/20">
                  <div className="absolute inset-2 rounded-full border border-[#5D5FEF]/30" />
                  <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5D5FEF] shadow-[0_0_0_10px_rgba(93,95,239,0.10)]" />
                </div>

                <div className="absolute left-[20%] top-[22%] h-8 w-8 rounded-full border-2 border-[#5D5FEF] bg-white shadow-sm" />
                <div className="absolute right-[18%] top-[30%] h-7 w-7 rounded-full border-2 border-[#5D5FEF] bg-white shadow-sm" />
                <div className="absolute left-[25%] bottom-[24%] h-7 w-7 rounded-full border-2 border-[#5D5FEF] bg-white shadow-sm" />
                <div className="absolute right-[30%] bottom-[28%] h-8 w-8 rounded-full border-2 border-[#5D5FEF] bg-white shadow-sm" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-400">
                Personas cerca
              </p>
              <span className="text-xs font-semibold text-slate-500">
                {nearbyPeople.length} activos
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {nearbyPeople.map((person, index) => {
                const isActive = index === selectedIndex;

                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-[1.25rem] border bg-white p-3 text-left shadow-sm transition ${isActive
                        ? "border-[#5D5FEF]/30 ring-1 ring-[#5D5FEF]/10"
                        : "border-slate-100 hover:border-slate-200"
                      }`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#5D5FEF] bg-slate-50 text-xs font-black text-slate-900">
                      {getInitials(person.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900">
                        {person.name}
                      </p>
                      <p className="truncate text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#5D5FEF]">
                        {person.profession}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <RadarCard
                name={currentPerson.name}
                profession={currentPerson.profession}
                city={currentPerson.city}
                bio={currentPerson.bio}
                onSkip={handleSkip}
                onConnect={handleConnect}
                active
              />
            </div>

            {lastAction ? (
              <p className="mt-4 text-center text-sm font-semibold text-emerald-600">
                {lastAction}
              </p>
            ) : null}
          </div>
        ) : null}

        {activeSection === "events" ? (
          <div className="rounded-[2rem] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-slate-400">
                  LookUp
                </p>
                <h2 className="mt-1 text-[2rem] font-black italic tracking-[-0.04em] text-[#5D5FEF]">
                  Actividades
                </h2>
              </div>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg"
              >
                🔍
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 text-[0.65rem] font-black uppercase tracking-[0.2em]">
              <span className="text-[#5D5FEF]">EVENTOS</span>
              <span className="flex h-6 w-12 items-center rounded-full bg-slate-100 p-1">
                <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </span>
              <span className="text-slate-400">PEOPLE</span>
            </div>

            <p className="mt-2 text-center text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-400">
              Descubre promociones y actividades
            </p>

            <div className="mt-4 rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
              <div className="relative h-64 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,#eef1f8_0%,#dee3ee_100%)]">
                <div
                  className="absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      "linear-gradient(#dfe6f8 1px, transparent 1px), linear-gradient(90deg, #dfe6f8 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                />
                <div className="absolute left-[30%] top-[28%] h-10 w-10 rounded-full border-2 border-[#5D5FEF] bg-white" />
                <div className="absolute left-[46%] top-[40%] h-8 w-8 rounded-full border-2 border-[#5D5FEF] bg-white" />
                <div className="absolute left-[58%] top-[34%] h-9 w-9 rounded-full border-2 border-[#5D5FEF] bg-white" />
                <div className="absolute left-[38%] top-[48%] h-8 w-8 rounded-full border-2 border-[#5D5FEF] bg-white" />
                <div className="absolute left-[22%] top-[52%] h-8 w-8 rounded-full border-2 border-[#5D5FEF] bg-white" />
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5D5FEF] text-2xl font-black text-white shadow-[0_14px_30px_rgba(93,95,239,0.28)]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {["Todo", "Ocio nocturno", "Deporte", "Gastro"].map((chip, index) => (
                <button
                  key={chip}
                  type="button"
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide ${index === 0
                      ? "border-[#5D5FEF] bg-[#5D5FEF] text-white"
                      : "border-slate-200 bg-white text-slate-500"
                    }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {featuredEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-slate-400">
                        {event.label}
                      </p>
                      <h3 className="mt-1 text-base font-black text-slate-900">
                        {event.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#5D5FEF]/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wide text-[#5D5FEF]">
                      {event.city}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {activeSection === "settings" ? (
          <div className="rounded-[2rem] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[1.8rem] font-black italic tracking-[-0.04em] text-slate-900">
                Configuración
              </h2>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-600"
              >
                Guardar
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#5D5FEF] bg-slate-100 text-2xl font-black text-slate-800">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <h3 className="mt-4 text-2xl font-black text-slate-900">
                {displayName}
              </h3>

              <p className="text-sm font-semibold text-[#5D5FEF]">
                {profile?.username ? `@${profile.username}` : "@tunombre"}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-slate-400">
                  Instagram
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profile?.instagram ?? "No añadido"}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-slate-400">
                  Twitter / X
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {profile?.twitter ?? "No añadido"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[#eef0ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                Privacidad y seguridad
              </p>
              <button
                type="button"
                onClick={() => setProfileVisible((current) => !current)}
                className="mt-3 flex w-full items-center justify-between rounded-[1.2rem] bg-white px-4 py-4 text-left shadow-sm"
              >
                <div>
                  <p className="text-sm font-black text-[#5D5FEF]">
                    Bloquear ubicación actual
                  </p>
                  <p className="text-xs font-semibold text-[#5D5FEF]/80">
                    Nadie te verá en este punto
                  </p>
                </div>

                <span className="text-xl">{profileVisible ? "📍" : "🚫"}</span>
              </button>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                Legal
              </p>

              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-[1.2rem] border border-slate-100 bg-white px-4 py-4 text-left"
                >
                  <span className="text-sm font-black text-slate-900">
                    Política de privacidad
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-[1.2rem] border border-slate-100 bg-white px-4 py-4 text-left"
                >
                  <span className="text-sm font-black text-slate-900">
                    Términos de uso
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.replace("/login/signup");
                  }}
                  className="flex w-full items-center justify-between rounded-[1.2rem] border border-red-100 bg-red-50 px-4 py-4 text-left"
                >
                  <span className="text-sm font-black text-red-600">
                    Cerrar sesión
                  </span>
                  <span className="text-red-400">⎋</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <BottomNav active={activeSection} onChange={setActiveSection} />
    </main>
  );
}