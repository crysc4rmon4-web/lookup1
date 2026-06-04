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

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackType>({
      type: null,
      message: "",
    });

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const cleanName = useMemo(
    () => normalizeFullName(fullName),
    [fullName]
  );

  const cleanEmail = useMemo(
    () => normalizeEmail(email),
    [email]
  );

  const passwordError = useMemo(
    () => getPasswordError(password),
    [password]
  );

  function clearErrors() {
    setFieldErrors({});
    setFeedback({
      type: null,
      message: "",
    });
  }

  function getInputClasses(
    hasError: boolean
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
                                                                                                                                                                                                                  focus:border-[#5D5FEF]
                                                                                                                                                                                                                        ${hasError
        ? `
                                                                                                                                                                                                                                                  border-red-400
                                                                                                                                                                                                                                                          shadow-[0_0_0_4px_rgba(239,68,68,0.12)]
                                                                                                                                                                                                                                                                `
        : `
                                                                                                                                                                                                                                                                                  border-slate-200
                                                                                                                                                                                                                                                                                        `
      }
                                                                                                                                                                                                                                                                                                  `;
  }

  async function handleSignup(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    clearErrors();

    const errors: FieldErrors = {};

    if (!cleanName) {
      errors.fullName =
        "Introduce nombre y apellido";
    }

    else if (
      cleanName.split(" ").length < 2
    ) {
      errors.fullName =
        "Introduce nombre y apellido completos";
    }

    if (!isValidEmail(cleanEmail)) {
      errors.email =
        "Introduce un email válido";
    }

    if (passwordError) {
      errors.password =
        passwordError;
    }

    if (
      Object.keys(errors).length
    ) {
      setFieldErrors(errors);

      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
            },
          },
        });

      if (error) {

        setFeedback({
          type: "error",
          message:
            error.message ===
              "email rate limit exceeded"
              ? "Demasiados intentos. Espera un momento y vuelve a intentarlo."
              : error.message,
        });

        return;
      }

      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        console.log(
          "USER CREATED:",
          data
        );
      }

      setFeedback({
        type: "success",
        message:
          "Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta.",
      });

      setFullName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        router.replace(
          `/login?email=${encodeURIComponent(
            cleanEmail
          )}&message=check_email`
        );
      }, 1200);

    } catch {

      setFeedback({
        type: "error",
        message:
          "Ha ocurrido un error inesperado.",
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
          onSubmit={handleSignup}
          noValidate
          className="mt-14 w-full space-y-4"
        >

          <div>

            <input
              type="text"
              placeholder="Nombre Completo"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearErrors();
              }}
              disabled={loading}
              autoComplete="name"
              className={getInputClasses(
                !!fieldErrors.fullName
              )}
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
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              disabled={loading}
              autoComplete="email"
              className={getInputClasses(
                !!fieldErrors.email
              )}
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
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              disabled={loading}
              autoComplete="new-password"
              className={getInputClasses(
                !!fieldErrors.password
              )}
            />

            {fieldErrors.password && (

              <p className="mt-2 px-2 text-sm text-red-500">

                {fieldErrors.password}

              </p>

            )}

          </div>

          <p className="px-2 text-[0.78rem] text-slate-500">

            La contraseña debe tener mínimo
            8 caracteres, una mayúscula,
            una minúscula, un número y un símbolo.

          </p>

          <button
            type="submit"
            disabled={loading}
            className="h-[68px] w-full rounded-[1.75rem] bg-[#5D5FEF] text-[1.05rem] font-black uppercase text-white shadow-[0_14px_30px_rgba(93,95,239,0.28)]"
          >

            {loading
              ? "CREANDO..."
              : "CREAR CUENTA"}

          </button>

          {feedback.message && (

            <p
              className={`text-center text-sm font-medium ${feedback.type ===
                  "error"
                  ? "text-red-500"
                  : "text-green-600"
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