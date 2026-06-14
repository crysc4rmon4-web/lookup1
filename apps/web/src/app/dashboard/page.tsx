"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../components/auth-provider";
import { useProfileStatus } from "../../hooks/use-profile-status";

export default function DashboardPage() {
  const router = useRouter();

  const { signOut } = useAuth();
  const {
    user,
    profile,
    loading,
    needsOnboarding,
  } = useProfileStatus();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login/signup");
      return;
    }

    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, needsOnboarding, router, user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-500">
          Cargando sesión...
        </p>
      </main>
    );
  }

  if (!user || needsOnboarding) {
    return null;
  }

  const displayName =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    "LookUp user";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            LookUp
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Hola, {displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sesión activa y base lista para el siguiente bloque.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Estado
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              Usuario autenticado
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {user.email}
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Perfil
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {profile?.username ? `@${profile.username}` : "Sin username"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {profile?.profession ?? "Profesión pendiente"}
              {profile?.city ? ` · ${profile.city}` : ""}
            </p>
          </article>
        </div>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            Siguiente paso
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            Onboarding + radar
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Base lista para movernos a la siguiente capa.
          </p>
        </article>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.replace("/login/signup");
          }}
          className="h-14 rounded-[1.5rem] bg-[#5D5FEF] px-6 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.22)] transition hover:bg-[#5153e6]"
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}