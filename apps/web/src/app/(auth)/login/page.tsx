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
} from "next/navigation";

import {
  getMyProfile,
  supabase,
  type ProfileRow,
} from "@lookup/services";

import {
  isValidEmail,
  normalizeEmail,
} from "@lookup/utils";

import { useAuth } from "../../../components/auth-provider";

import {
  getAuthenticatedDestination,
} from "../../../lib/account-routing";

type FieldErrors = {
  email?: string;
  password?: string;
};

type FeedbackType = {
  type:
    | "success"
    | "error"
    | "info"
    | null;

  message: string;
};

type AuthFlash = {
  type?:
    | "success"
    | "error"
    | "info";

  message?: string;
  email?: string;
};

const AUTH_FLASH_KEY =
  "lookup:auth-flash";

export default function LoginPage() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    feedback,
    setFeedback,
  ] =
    useState<FeedbackType>({
      type: "info",
      message:
        "Inicia sesión con tu cuenta para continuar.",
    });

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<FieldErrors>({});

  const cleanEmail =
    useMemo(
      () =>
        normalizeEmail(email),
      [email],
    );

  /*
   * Si Supabase ya restauró una sesión,
   * resolvemos el destino correcto
   * mediante la misma función utilizada
   * por el resto de la aplicación.
   */
  useEffect(() => {
    if (
      authLoading ||
      !user
    ) {
      return;
    }

    let active = true;

    async function redirectAuthenticatedUser() {
      try {
        const {
          data,
          error,
        } =
          await getMyProfile(
            user!.id,
          );

        if (!active) {
          return;
        }

        if (error) {
          console.error(
            "❌ Error resolviendo perfil después del login",
            error,
          );

          return;
        }

        router.replace(
          getAuthenticatedDestination(
            data as ProfileRow | null,
          ),
        );
      } catch (error) {
        console.error(
          "❌ Error resolviendo destino autenticado",
          error,
        );
      }
    }

    void redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [
    authLoading,
    user,
    router,
  ]);

  /*
   * Feedback procedente del signup.
   */
  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const raw =
      window.sessionStorage.getItem(
        AUTH_FLASH_KEY,
      );

    if (raw) {
      window.sessionStorage.removeItem(
        AUTH_FLASH_KEY,
      );

      try {
        const flash =
          JSON.parse(
            raw,
          ) as AuthFlash;

        if (
          typeof flash.email ===
            "string" &&
          flash.email
        ) {
          setEmail(
            flash.email,
          );
        }

        if (
          typeof flash.message ===
            "string" &&
          flash.message
        ) {
          setFeedback({
            type:
              flash.type ??
              "info",
            message:
              flash.message,
          });
        }
      } catch {
        window.sessionStorage.removeItem(
          AUTH_FLASH_KEY,
        );
      }
    }

    /*
     * Mensaje posterior a la
     * verificación por correo.
     */
    const params =
      new URLSearchParams(
        window.location.search,
      );

    if (
      params.get(
        "verified",
      ) === "1"
    ) {
      setFeedback({
        type: "success",
        message:
          "Correo verificado correctamente. Ya puedes iniciar sesión.",
      });

      window.history.replaceState(
        {},
        "",
        window.location.pathname,
      );
    }
  }, []);

  function resetErrors() {
    setFieldErrors({});

    setFeedback(
      (current) =>
        current.type ===
        "info"
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
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      loading ||
      authLoading
    ) {
      return;
    }

    resetErrors();

    const errors: FieldErrors =
      {};

    if (
      !isValidEmail(
        cleanEmail,
      )
    ) {
      errors.email =
        "Introduce un email válido";
    }

    if (!password) {
      errors.password =
        "Introduce tu contraseña";
    }

    if (
      Object.keys(
        errors,
      ).length > 0
    ) {
      setFieldErrors(
        errors,
      );

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
            email:
              cleanEmail,
            password,
          },
        );

      if (error) {
        /*
         * Mensaje deliberadamente
         * genérico para no revelar
         * si un email concreto existe.
         */
        setFeedback({
          type: "error",
          message:
            "Correo o contraseña incorrectos. Si todavía no tienes una cuenta, regístrate.",
        });

        return;
      }

      if (!data.user) {
        throw new Error(
          "No se pudo recuperar la sesión.",
        );
      }

      const {
        data:
          profileData,
        error:
          profileError,
      } =
        await getMyProfile(
          data.user.id,
        );

      if (profileError) {
        throw profileError;
      }

      router.replace(
        getAuthenticatedDestination(
          profileData as ProfileRow | null,
        ),
      );
    } catch (error) {
      console.error(
        "❌ Error iniciando sesión",
        error,
      );

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
    <main className="flex min-h-screen justify-center bg-white px-6">
      <section className="flex w-full max-w-[390px] flex-col items-center pb-10 pt-16">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-[4.4rem] font-black italic leading-none tracking-[-0.07em] text-[#5D5FEF]">
            LookUp
          </h1>

          <p className="mt-3 text-[0.72rem] font-black uppercase tracking-[0.5em] text-slate-400">
            NETWORKING REAL
          </p>
        </header>

        <form
          onSubmit={
            handleLogin
          }
          noValidate
          className="mt-14 w-full space-y-4"
        >
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(
                event,
              ) => {
                setEmail(
                  event.target
                    .value,
                );

                setFieldErrors(
                  (
                    current,
                  ) => {
                    const next =
                      {
                        ...current,
                      };

                    delete next.email;

                    return next;
                  },
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
                Boolean(
                  fieldErrors.email,
                ),
              )}
            />

            {fieldErrors.email ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {
                  fieldErrors.email
                }
              </p>
            ) : null}
          </div>

          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(
                event,
              ) => {
                setPassword(
                  event.target
                    .value,
                );

                setFieldErrors(
                  (
                    current,
                  ) => {
                    const next =
                      {
                        ...current,
                      };

                    delete next.password;

                    return next;
                  },
                );
              }}
              disabled={
                loading ||
                authLoading
              }
              autoComplete="current-password"
              className={getInputClasses(
                Boolean(
                  fieldErrors.password,
                ),
              )}
            />

            {fieldErrors.password ? (
              <p className="mt-2 px-2 text-sm text-red-500">
                {
                  fieldErrors.password
                }
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              authLoading
            }
            className="
              h-[68px]
              w-full
              rounded-[1.75rem]
              bg-[#5D5FEF]
              text-[1.05rem]
              font-black
              uppercase
              tracking-wide
              text-white
              shadow-[0_14px_30px_rgba(93,95,239,0.28)]
              transition
              hover:bg-[#5153e6]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
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
                      "success"
                    ? "text-emerald-600"
                    : "text-slate-500"
              }`}
            >
              {
                feedback.message
              }
            </p>
          ) : null}

          <div className="pt-2 text-center">
            <Link
              href="/login/signup"
              className="text-sm font-semibold text-[#5D5FEF] underline underline-offset-4"
            >
              ¿No tienes cuenta?
              Regístrate
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}