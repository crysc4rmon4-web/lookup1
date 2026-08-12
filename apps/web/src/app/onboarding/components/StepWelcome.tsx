"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

type Props = {
  fullName: string;
  onFinish: () => void;
};

export function StepWelcome({ fullName, onFinish }: Props) {
  const firstName = fullName.trim().split(" ")[0] || "Bienvenido";

  return (
    <section className="flex min-h-[620px] flex-col items-center justify-center text-center">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.85,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
        }}
      >
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-[#EEF0FF]">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#5D5FEF]/10" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#5D5FEF] shadow-xl">
            <Sparkles size={42} className="text-white" />
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.15,
          duration: 0.5,
        }}
        className="mt-12"
      >
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#5D5FEF]">
          LOOKUP
        </p>

        <h1 className="mt-4 text-5xl font-black leading-tight text-[#111827]">
          ¡Bienvenido,
          <br />
          {firstName}!
        </h1>

        <p className="mx-auto mt-6 max-w-md text-lg leading-8 text-slate-500">
          Tu perfil ya forma parte de la comunidad. Desde ahora podrás descubrir
          personas, crear conexiones y explorar eventos cerca de ti.
        </p>
      </motion.div>
      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.3,
          duration: 0.5,
        }}
        className="mt-12 w-full"
      >
        <div className="mx-auto mb-10 max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF0FF]">
              <Sparkles size={24} className="text-[#5D5FEF]" />
            </div>

            <div className="text-left">
              <h3 className="font-bold text-slate-900">Todo está preparado</h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Activa tu ubicación para empezar a descubrir personas y eventos
                cercanos en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{
            scale: 1.02,
          }}
          whileTap={{
            scale: 0.98,
          }}
          type="button"
          onClick={onFinish}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-3
            rounded-3xl
            bg-[#5D5FEF]
            py-5
            text-lg
            font-bold
            text-white
            shadow-lg
            shadow-[#5D5FEF]/30
            transition-all
            hover:bg-[#4F51E8]
          "
        >
          Entrar en LookUp
          <ArrowRight size={22} />
        </motion.button>
      </motion.div>
    </section>
  );
}
