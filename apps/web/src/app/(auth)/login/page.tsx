"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@lookup/services";

import {
  isValidEmail,
  normalizeEmail,
} from "@lookup/utils";

import { useAuth } from "../../../components/auth-provider";

type FieldErrors = {
  email?: string;
  password?: string;
};

type FeedbackType = {
  type: "success" | "error" | "info" | null;
  message: string;
};

export default function LoginPage() {

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const initialEmail =
    searchParams.get("email") ?? "";

  const initialMessage =
    searchParams.get("message") ?? "";

  const [email, setEmail] =
    useState(initialEmail);

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackType>({
      type: null,
      message: "",
    });

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const cleanEmail = useMemo(
    () => normalizeEmail(email),
    [email],
  );

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (
      initialMessage === "check_email"
    ) {
      setFeedback({
        type: "info",
        message:
          "Cuenta creada. Revisa tu correo para verificarla.",
      });
    }
  }, [initialMessage]);

  useEffect(() => {

    if (!authLoading && user) {
      router.replace("/dashboard");
    }

  }, [
    authLoading,
    user,
    router,
  ]);

  function resetErrors() {

    setFieldErrors({});

    setFeedback((current) =>
      current.type === "info"
        ? current
        : {
            type: null,
            message: "",
          },
    );
  }

  function getInputClasses(
    hasError: boolean,
  ) {
    return `
      h-[68px]
      w-full
      rounded-[1.75rem]
      border
      bg-[#fafafa]
      px-6
      text-[1rem]
      font-semibold
      text-slate-800
      outline-none
      transition-all
      placeholder:text-slate-400
      focus:bg-white
      ${
        hasError
          ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
          : "border-slate-200 focus:border-[#5D5FEF]"
      }
    `;
  }

  async function handleLogin(
    e: FormEvent<HTMLFormElement>,
  ) {

    e.preventDefault();

    if (
      loading ||
      authLoading
    ) {
      return;
    }

    resetErrors();

    const errors: FieldErrors = {};

    if (
      !isValidEmail(cleanEmail)
    ) {
      errors.email =
        "Introduce un email válido";
    }

    if (!password) {
      errors.password =
        "Introduce tu contraseña";
    }

    if (
      Object.keys(errors).length > 0
    ) {
      setFieldErrors(errors);
      return;
    }

    try {

      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: cleanEmail,
            password,
          },
        );

      if (error) {

        setFeedback({
          type: "error",
          message: error.message,
        });

        return;
      }

      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        console.log(
          "LOGIN DATA:",
          data,
        );
      }

      router.replace(
        "/dashboard",
      );

    } catch {

      setFeedback({
        type: "error",
        message:
          "No se pudo iniciar sesión. Inténtalo de nuevo.",
      });

    } finally {

      setLoading(false);

    }
  }

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

        <form
          onSubmit={handleLogin}
          noValidate
          className="mt-14 w-full space-y-4"
        >

          <div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {

                setEmail(
                  e.target.value,
                );

                setFieldErrors(
                  (current) => ({
                    ...current,
                    email: undefined,
                  }),
                );
              }}
              disabled={
                loading ||
                authLoading
              }
              autoComplete="email"
              spellCheck={false}
              inputMode="email"
              className={getInputClasses(
                !!fieldErrors.email,
              )}
            />

            {fieldErrors.email ? (

              <p className="mt-2 px-2 text-sm text-red-500">

                {fieldErrors.email}

              </p>

            ) : null}

          </div>

          <div>

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => {

                setPassword(
                  e.target.value,
                );

                setFieldErrors(
                  (current) => ({
                    ...current,
                    password: undefined,
                  }),
                );
              }}
              disabled={
                loading ||
                authLoading
              }
              autoComplete="current-password"
              className={getInputClasses(
                !!fieldErrors.password,
              )}
            />

            {fieldErrors.password ? (

              <p className="mt-2 px-2 text-sm text-red-500">

                {fieldErrors.password}

              </p>

            ) : null}

          </div>

          <button
            type="submit"
            disabled={
              loading ||
              authLoading
            }
            className="h-[68px] w-full rounded-[1.75rem] bg-[#5D5FEF] text-[1.05rem] font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.28)] transition hover:bg-[#5153e6] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "ENTRANDO..."
              : "INICIAR SESIÓN"}

          </button>

          {feedback.message ? (

            <p
              className={`pt-2 text-center text-sm font-medium ${
                feedback.type ===
                "error"
                  ? "text-red-500"
                  : feedback.type ===
                      "info"
                    ? "text-slate-500"
                    : "text-green-600"
              }`}
            >

              {feedback.message}

            </p>

          ) : null}

          <div className="pt-2 text-center">

            <Link
              href="/login/signup"
              className="text-sm font-semibold text-[#5D5FEF] underline underline-offset-4"
            >

              ¿No tienes cuenta? Regístrate

            </Link>

          </div>

        </form>

      </section>

    </main>
  );
}