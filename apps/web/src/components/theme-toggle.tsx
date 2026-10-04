"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.dataset.theme === "dark");
    sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "lookup-theme") return;
      document.documentElement.dataset.theme =
        event.newValue === "dark" ? "dark" : "light";
      sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("lookup-theme", next);
    } catch {
      /* Still works without persistent storage. */
    }
    setDark(!dark);
  }
  return (
    <section
      aria-labelledby="appearance-heading"
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="appearance-heading" className="font-bold text-slate-900">
            Apariencia
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {dark ? "Tema oscuro" : "Tema claro"} · Guardado en este dispositivo
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Tema oscuro"
          onClick={toggle}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5557D8] focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {dark ? (
            <Moon size={23} aria-hidden="true" />
          ) : (
            <Sun size={23} aria-hidden="true" />
          )}
        </button>
      </div>
    </section>
  );
}
