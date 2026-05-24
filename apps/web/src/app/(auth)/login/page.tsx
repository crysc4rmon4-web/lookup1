"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@lookup/services";
import { isValidEmail, normalizeEmail } from "@lookup/utils";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") ?? "";
  const initialMessage = searchParams.get("message") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  useEffect(() => {
    if (initialMessage === "check_email") {
      setFeedback({
        type: "info",
        message: "Cuenta creada. Revisa tu correo para verificarla.",
      });
    }
  }, [initialMessage]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setFeedback({
      type: null,
      message: "",
    });

    const cleanEmail = normalizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setFeedback({
        type: "error",
        message: "Introduce un email válido",
      });
      return;
    }

    if (!password) {
      setFeedback({
        type: "error",
        message: "Introduce tu contraseña",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setFeedback({
          type: "error",
          message: error.message,
        });
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("LOGIN DATA:", data);
      }

      setFeedback({
        type: "success",
        message: "Sesión iniciada correctamente.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "No se pudo iniciar sesión. Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 flex justify-center">
      <section className="w-full max-w-[390px] flex flex-col items-center pt-16 pb-10">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-[4.4rem] leading-none font-black italic tracking-[-0.07em] text-[#5D5FEF]">
            LookUp
          </h1>

          <p className="mt-3 text-[0.72rem] font-black uppercase tracking-[0.5em] text-slate-400">
            NETWORKING REAL
          </p>
        </header>

        <form onSubmit={handleLogin} noValidate className="mt-14 w-full space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            className="h-[68px] w-full rounded-[1.75rem] border border-slate-200 bg-[#fafafa] px-6 text-[1rem] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white disabled:opacity-70"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            className="h-[68px] w-full rounded-[1.75rem] border border-slate-200 bg-[#fafafa] px-6 text-[1rem] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white disabled:opacity-70"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-[68px] w-full rounded-[1.75rem] bg-[#5D5FEF] text-[1.05rem] font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.28)] transition hover:bg-[#5153e6] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "ENTRANDO..." : "INICIAR SESIÓN"}
          </button>

          {feedback.message ? (
            <p
              className={`pt-2 text-center text-sm font-medium ${
                feedback.type === "error"
                  ? "text-red-500"
                  : feedback.type === "info"
                    ? "text-slate-500"
                    : "text-green-600"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="pt-2 text-center">
            <a
              href="/login/signup"
              className="text-sm font-semibold text-[#5D5FEF] underline underline-offset-4"
            >
              ¿No tienes cuenta? Regístrate
            </a>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login/signup")}
              className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-slate-400"
            >
              Crear cuenta
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}