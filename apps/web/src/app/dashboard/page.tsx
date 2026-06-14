"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/auth-provider";
import { useProfileStatus } from "../../hooks/use-profile-status";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DashboardPage() {
  const router = useRouter();

  const { signOut } = useAuth();
  const { user, profile, loading, needsOnboarding } = useProfileStatus();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login/signup");
    }
  }, [loading, router, user]);

  const displayName = useMemo(() => {
    return (
      profile?.full_name ??
      user?.user_metadata?.full_name ??
      "LookUp user"
    );
  }, [profile?.full_name, user?.user_metadata?.full_name]);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-500">
          Cargando sesión...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            LookUp
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Hola, {displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Perfil activo y base lista para entrar al radar.
          </p>

          {needsOnboarding && (
            <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-700">
                Perfil pendiente de completar.
              </p>
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                Completar perfil
              </button>
            </div>
          )}
        </header>

        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#5D5FEF] bg-slate-100 text-xl font-black text-slate-800">
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

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                  Perfil
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#5D5FEF]">
                  {profile?.username ? `@${profile.username}` : "Sin username"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {profile?.profession ?? "Sin profesión"} ·{" "}
                  {profile?.city ?? "Sin ciudad"}
                </p>
              </div>
            </div>

            {profile?.bio ? (
              <p className="mt-5 rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-5 rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                Aún no has añadido una bio. Este bloque alimentará tu ficha pública.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Perfil completado
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${profile?.visibility
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                  }`}
              >
                {profile?.visibility ? "Visible en radar" : "Oculto"}
              </span>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <article className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                Estado
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                Usuario autenticado
              </p>
              <p className="mt-1 break-all text-sm text-slate-500">
                {user.email}
              </p>
            </article>

            <article className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                Contacto
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-400">
                    Instagram
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {profile?.instagram ?? "No añadido"}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-400">
                    Twitter / X
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {profile?.twitter ?? "No añadido"}
                  </p>
                </div>
              </div>
            </article>
          </aside>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="h-14 rounded-[1.5rem] bg-[#5D5FEF] px-6 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.22)] transition hover:bg-[#5153e6]"
          >
            Editar perfil
          </button>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/login/signup");
            }}
            className="h-14 rounded-[1.5rem] bg-white px-6 text-sm font-black uppercase tracking-wide text-red-600 shadow-sm ring-1 ring-red-100 transition hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            Siguiente bloque
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-900">
            Radar + personas cercanas
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Base lista para construir la vista principal de LookUp.
          </p>
        </div>
      </section>
    </main>
  );
}