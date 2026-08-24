"use client";

import {
  LoaderCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "@/components/auth-provider";

import {
  DEFAULT_EVENT_DISCOVERY_DATE_SCOPE,
  EVENT_DISCOVERY_INTENT_MAX_LENGTH,
  isEditableEventDiscoveryDateScope,
  type EditableEventDiscoveryDateScope,
} from "@/lib/events/event-discovery-preferences";

import {
  getEventDiscoveryPreferences,
  updateEventDiscoveryPreferences,
} from "@/services/events/event-discovery-preferences";

type EventDiscoveryContextPanelProps = {
  onPreferencesChanged?:
  () =>
    | void
    | Promise<void>;
};

const DATE_OPTIONS: readonly {
  value:
  EditableEventDiscoveryDateScope;

  label:
  string;
}[] = [
    {
      value:
        "all",

      label:
        "Todo",
    },
    {
      value:
        "today",

      label:
        "Hoy",
    },
    {
      value:
        "week",

      label:
        "Esta semana",
    },
    {
      value:
        "weekend",

      label:
        "Este finde",
    },
    {
      value:
        "month",

      label:
        "Este mes",
    },
  ];

export function EventDiscoveryContextPanel({
  onPreferencesChanged,
}: EventDiscoveryContextPanelProps) {
  const {
    session,
  } =
    useAuth();

  const [
    dateScope,
    setDateScope,
  ] =
    useState<EditableEventDiscoveryDateScope>(
      DEFAULT_EVENT_DISCOVERY_DATE_SCOPE,
    );

  const [
    intentDraft,
    setIntentDraft,
  ] =
    useState("");

  const [
    savedIntent,
    setSavedIntent,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    const accessToken =
      session
        ?.access_token
        ?.trim();

    if (
      !accessToken
    ) {
      setLoading(
        false,
      );

      return;
    }

    /*
     * Referencia estable después de validar la sesión.
     * TypeScript no conserva el narrowing dentro de
     * una función async anidada.
     */
    const validAccessToken =
      accessToken;

    const controller =
      new AbortController();

    let cancelled =
      false;

    async function loadPreferences() {
      setLoading(
        true,
      );

      setError(
        null,
      );

      try {
        const preferences =
          await getEventDiscoveryPreferences({
            accessToken:
              validAccessToken,

            signal:
              controller.signal,
          });

        if (
          cancelled
        ) {
          return;
        }

        const nextScope =
          isEditableEventDiscoveryDateScope(
            preferences.dateScope,
          )
            ? preferences.dateScope
            : DEFAULT_EVENT_DISCOVERY_DATE_SCOPE;

        const nextIntent =
          preferences.intentText
            ?.trim() ??
          "";

        setDateScope(
          nextScope,
        );

        setIntentDraft(
          nextIntent,
        );

        setSavedIntent(
          nextIntent,
        );
      } catch (
      loadError
      ) {
        if (
          cancelled ||
          controller.signal
            .aborted
        ) {
          return;
        }

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "No se pudo cargar tu contexto de descubrimiento.",
        );
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadPreferences();

    return () => {
      cancelled =
        true;

      controller.abort();
    };
  }, [
    session
      ?.access_token,
  ]);

  async function handleDateScopeChange(
    nextScope:
      EditableEventDiscoveryDateScope,
  ) {
    const accessToken =
      session
        ?.access_token
        ?.trim();

    if (
      !accessToken ||
      saving ||
      nextScope ===
      dateScope
    ) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      null,
    );

    try {
      const preferences =
        await updateEventDiscoveryPreferences({
          accessToken,

          dateScope:
            nextScope,
        });

      setDateScope(
        isEditableEventDiscoveryDateScope(
          preferences.dateScope,
        )
          ? preferences.dateScope
          : DEFAULT_EVENT_DISCOVERY_DATE_SCOPE,
      );

      await onPreferencesChanged?.();
    } catch (
    saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "No se pudo cambiar el periodo.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function saveIntent(
    value:
      string,
  ) {
    const accessToken =
      session
        ?.access_token
        ?.trim();

    if (
      !accessToken ||
      saving
    ) {
      return;
    }

    setSaving(
      true,
    );

    setError(
      null,
    );

    try {
      const preferences =
        await updateEventDiscoveryPreferences({
          accessToken,

          intentText:
            value,
        });

      const nextIntent =
        preferences.intentText
          ?.trim() ??
        "";

      setIntentDraft(
        nextIntent,
      );

      setSavedIntent(
        nextIntent,
      );

      await onPreferencesChanged?.();
    } catch (
    saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "No se pudo guardar lo que buscas ahora.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  if (
    loading
  ) {
    return (
      <section className="rounded-[2rem] border border-[#E5E6F7] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <LoaderCircle
            size={18}
            className="animate-spin text-[#5D5FEF]"
          />

          <p className="text-sm font-bold text-slate-500">
            Preparando tu contexto de descubrimiento…
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#E1E2FA] bg-gradient-to-br from-white via-white to-[#F8F8FF] p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
          <Sparkles
            size={19}
          />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
            Tu contexto ahora
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
            Dile a LookUp qué te interesa hoy
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Elige cuándo quieres descubrir algo y, si quieres, añade una intención temporal. No cambia tu perfil.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-400">
          Cuándo
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {DATE_OPTIONS.map(
            (
              option,
            ) => {
              const selected =
                dateScope ===
                option.value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    void handleDateScopeChange(
                      option.value,
                    )
                  }
                  className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${selected
                    ? "border-[#5D5FEF] bg-[#5D5FEF] text-white shadow-md shadow-[#5D5FEF]/15"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#5D5FEF]/25 hover:bg-[#F8F8FF] hover:text-[#5557D8]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {
                    option.label
                  }
                </button>
              );
            },
          )}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="event-discovery-intent"
          className="text-xs font-black uppercase tracking-[0.1em] text-slate-400"
        >
          Qué buscas ahora
        </label>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="event-discovery-intent"
              value={
                intentDraft
              }
              onChange={(
                event,
              ) =>
                setIntentDraft(
                  event.target
                    .value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  void saveIntent(
                    intentDraft,
                  );
                }
              }}
              maxLength={
                EVENT_DISCOVERY_INTENT_MAX_LENGTH
              }
              disabled={
                saving
              }
              placeholder="Ej. conocer gente de IA, encontrar planes en familia…"
              className="w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10 disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void saveIntent(
                intentDraft,
              )
            }
            disabled={
              saving ||
              intentDraft
                .trim() ===
              savedIntent
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition hover:bg-[#5254DF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <Sparkles
                size={16}
              />
            )}

            Guardar
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] leading-5 text-slate-400">
            La intención dura 7 días y solo puede dar más peso a eventos relacionados.
          </p>

          {savedIntent ? (
            <button
              type="button"
              disabled={
                saving
              }
              onClick={() => {
                setIntentDraft(
                  "",
                );

                void saveIntent(
                  "",
                );
              }}
              className="inline-flex items-center gap-1 text-[11px] font-black text-slate-400 transition hover:text-[#5557D8] disabled:opacity-50"
            >
              <X
                size={13}
              />

              Quitar intención
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold leading-5 text-rose-700">
          {
            error
          }
        </p>
      ) : null}
    </section>
  );
}