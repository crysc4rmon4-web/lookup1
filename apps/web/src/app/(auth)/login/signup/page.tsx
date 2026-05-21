"use client";

import { useState } from "react";
import { supabase } from "@lookup/services";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    setMessage("Cuenta creada. Revisa tu correo si hace falta confirmación.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-12 flex items-start justify-center">
      <section className="w-full max-w-[390px] pt-8">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-[4rem] leading-none font-black italic text-[#5D5FEF] tracking-[-0.06em]">
            LookUp
          </h1>
          <p className="mt-4 text-[0.7rem] font-black uppercase tracking-[0.45em] text-slate-400">
            Networking Real
          </p>
        </header>

        <form onSubmit={handleSignup} className="mt-16 space-y-6">
          <input
            type="text"
            placeholder="Nombre Completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-[68px] w-full rounded-[1.75rem] border border-slate-200 bg-[#fafafa] px-6 text-[1rem] font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[68px] w-full rounded-[1.75rem] border border-slate-200 bg-[#fafafa] px-6 text-[1rem] font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[68px] w-full rounded-[1.75rem] border border-slate-200 bg-[#fafafa] px-6 text-[1rem] font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-[68px] w-full rounded-[1.75rem] bg-[#5D5FEF] text-[1.05rem] font-black uppercase tracking-wide text-white shadow-[0_14px_30px_rgba(93,95,239,0.28)] transition hover:bg-[#5153e6] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "CREANDO..." : "CREAR CUENTA"}
          </button>

          {message ? (
            <p className="pt-2 text-center text-sm font-medium text-slate-600">
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}