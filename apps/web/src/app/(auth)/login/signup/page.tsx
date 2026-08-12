"use client";

import { FormEvent, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@lookup/services";

import {
  getPasswordError,
  isValidEmail,
  normalizeEmail,
  normalizeFullName,
} from "@lookup/utils";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
};

type FeedbackType = {
  type: "success" | "error" | null;

  message: string;
};

type AuthFlash = {
  type: "success" | "error" | "info";

  message: string;
  email?: string;
};

const AUTH_FLASH_KEY = "lookup:auth-flash";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackType>({
    type: null,
    message: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const cleanName = useMemo(() => normalizeFullName(fullName), [fullName]);

  const cleanEmail = useMemo(() => normalizeEmail(email), [email]);

  const passwordError = useMemo(() => getPasswordError(password), [password]);

  function clearErrors() {
    setFieldErrors({});

    setFeedback({
      type: null,
      message: "",
    });
  }

  function getInputClasses(hasError: boolean) {
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
      focus:border-[#5D5FEF]
      ${
        hasError
          ? "border-red-400 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
          : "border-slate-200"
      }
    `;
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    clearErrors();

    const errors: FieldErrors = {};

    if (!cleanName) {
      errors.fullName = "Introduce nombre y apellido";
    } else if (cleanName.split(" ").length < 2) {
      errors.fullName = "Introduce nombre y apellido completos";
    }

    if (!isValidEmail(cleanEmail)) {
      errors.email = "Introduce un email válido";
    }

    if (passwordError) {
      errors.password = passwordError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,

        password,

        options: {
          data: {
            full_name: cleanName,
          },

          /*
           * La confirmación establece
           * la sesión de Supabase.
           *
           * Entramos directamente en
           * la selección de tipo de
           * cuenta sin pasar por un
           * login intermedio.
           */
          emailRedirectTo: `${window.location.origin}/account-type`,
        },
      });

      if (error) {
        const errorMessage = error.message.toLowerCase();

        setFeedback({
          type: "error",

          message: errorMessage.includes("rate limit")
            ? "Demasiados intentos. Espera un momento y vuelve a intentarlo."
            : "No se pudo completar el registro. Revisa los datos e inténtalo de nuevo.",
        });

        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("USER CREATED:", data.user?.id);
      }

      const flash: AuthFlash = {
        type: "info",

        email: cleanEmail,

        message:
          "Cuenta creada correctamente. Revisa tu correo para verificarla.",
      };

      window.sessionStorage.setItem(AUTH_FLASH_KEY, JSON.stringify(flash));

      setFeedback({
        type: "success",

        message: "Cuenta creada. Revisa tu correo para verificarla.",
      });

      setFullName("");
      setEmail("");
      setPassword("");

      window.setTimeout(() => {
        router.replace("/login");
      }, 1000);
    } catch (error) {
      console.error("❌ Error creando cuenta", error);

      setFeedback({
        type: "error",

        message: "Ha ocurrido un error inesperado.",
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
          onSubmit={handleSignup}
          noValidate
          className="mt-14 w-full space-y-4"
        >
          <div>
            <input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);

                clearErrors();
              }}
              disabled={loading}
              autoComplete="name"
              className={getInputClasses(Boolean(fieldErrors.fullName))}
            />

            {fieldErrors.fullName && (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                clearErrors();
              }}
              disabled={loading}
              autoComplete="email"
              spellCheck={false}
              inputMode="email"
              className={getInputClasses(Boolean(fieldErrors.email))}
            />

            {fieldErrors.email && (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                clearErrors();
              }}
              disabled={loading}
              autoComplete="new-password"
              className={getInputClasses(Boolean(fieldErrors.password))}
            />

            {fieldErrors.password && (
              <p className="mt-2 px-2 text-sm text-red-500">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <p className="px-2 text-[0.78rem] leading-5 text-slate-500">
            La contraseña debe tener mínimo 8 caracteres, una mayúscula, una
            minúscula, un número y un símbolo.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="
              h-[68px]
              w-full
              rounded-[1.75rem]
              bg-[#5D5FEF]
              text-[1.05rem]
              font-black
              uppercase
              text-white
              shadow-[0_14px_30px_rgba(93,95,239,0.28)]
              transition
              hover:bg-[#5153e6]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? "CREANDO..." : "CREAR CUENTA"}
          </button>

          {feedback.message && (
            <p
              className={`text-center text-sm font-medium ${
                feedback.type === "error" ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
