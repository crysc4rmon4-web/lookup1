"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Ticket,
  Users,
  X,
} from "lucide-react";

import {
  EVENT_LIMITS,
  EventValidationError,
  parseEventDraftCreateInput,
  type EventDraftCreateInput,
} from "@/lib/events/event-domain";

import {
  getSpainMunicipalities,
  getSpainProvinces,
  normalizeLocationSearch,
  type SpainMunicipality,
  type SpainProvince,
} from "@/lib/locations/spain-locations";

import {
  getEventCategories,
  type EventCategory,
} from "@/services/events/get-event-categories";

import type {
  MyEvent,
} from "@/services/events/get-my-events";

import {
  updateEvent,
} from "@/services/events/update-event";

type EditEventFormProps = {
  accessToken: string;

  event: MyEvent;

  onSaved: (
    event: MyEvent,
  ) => void;

  onClose: () => void;
};

type EventFormState = {
  title: string;
  description: string;
  category: string;

  tags: string[];
  audience: string[];

  venueName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  startAt: string;
  endAt: string;

  isFree: boolean;
  priceFrom: string;

  capacity: string;

  externalUrl: string;
  externalActionLabel: string;
};

type TokenFieldProps = {
  label: string;

  placeholder: string;

  values: string[];

  maximumItems: number;

  maximumLength: number;

  onChange: (
    values: string[],
  ) => void;
};

const DATE_TIME_STEP_MINUTES =
  15;

const MINIMUM_START_LEAD_MINUTES =
  5;

const DEFAULT_EVENT_DURATION_HOURS =
  2;

const INPUT_CLASS =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10 disabled:cursor-not-allowed disabled:opacity-60";

function padNumber(
  value: number,
) {
  return String(
    value,
  ).padStart(
    2,
    "0",
  );
}

function toLocalDateTimeInput(
  value: string | Date,
) {
  const date =
    value instanceof
      Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return [
    date.getFullYear(),
    "-",
    padNumber(
      date.getMonth() +
      1,
    ),
    "-",
    padNumber(
      date.getDate(),
    ),
    "T",
    padNumber(
      date.getHours(),
    ),
    ":",
    padNumber(
      date.getMinutes(),
    ),
  ].join("");
}

function roundUpToInterval(
  date: Date,
  intervalMinutes: number,
) {
  const result =
    new Date(date);

  const minutes =
    result.getMinutes();

  const remainder =
    minutes %
    intervalMinutes;

  if (
    remainder !==
    0
  ) {
    result.setMinutes(
      minutes +
      intervalMinutes -
      remainder,
    );
  }

  result.setSeconds(
    0,
    0,
  );

  return result;
}

function getMinimumStartDate() {
  return roundUpToInterval(
    new Date(
      Date.now() +
      MINIMUM_START_LEAD_MINUTES *
      60 *
      1000,
    ),
    DATE_TIME_STEP_MINUTES,
  );
}

function createInitialState(
  event: MyEvent,
): EventFormState {
  return {
    title:
      event.title,

    description:
      event.description,

    category:
      event.category,

    tags:
      [...event.tags],

    audience:
      [...event.audience],

    venueName:
      event.venueName,

    address:
      event.address,

    city:
      event.city,

    province:
      event.province ??
      "",

    postalCode:
      event.postalCode ??
      "",

    startAt:
      toLocalDateTimeInput(
        event.startAt,
      ),

    endAt:
      toLocalDateTimeInput(
        event.endAt,
      ),

    isFree:
      event.isFree,

    priceFrom:
      event.priceFrom ===
        null
        ? ""
        : String(
          event.priceFrom,
        ),

    capacity:
      event.capacity ===
        null
        ? ""
        : String(
          event.capacity,
        ),

    externalUrl:
      event.externalUrl ??
      "",

    externalActionLabel:
      event.externalActionLabel ??
      "",
  };
}

function toNullableNumber(
  value: string,
): number | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  const parsed =
    Number(
      normalized,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : Number.NaN;
}

function toIsoDateTime(
  value: string,
  label: string,
) {
  if (!value.trim()) {
    throw new Error(
      `${label} es obligatoria.`,
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${label} no es válida.`,
    );
  }

  return date.toISOString();
}

function normalizeExternalUrl(
  value: string,
): string | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate =
    /^https?:\/\//i.test(
      trimmed,
    )
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url =
      new URL(
        candidate,
      );

    if (
      url.protocol !==
      "http:" &&
      url.protocol !==
      "https:"
    ) {
      throw new Error();
    }

    return url.toString();
  } catch {
    throw new Error(
      "Introduce una dirección web válida.",
    );
  }
}

function TokenField({
  label,
  placeholder,
  values,
  maximumItems,
  maximumLength,
  onChange,
}: TokenFieldProps) {
  const [
    currentValue,
    setCurrentValue,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  function addValue() {
    const normalized =
      currentValue
        .trim()
        .replace(
          /\s+/g,
          " ",
        );

    if (!normalized) {
      setCurrentValue(
        "",
      );

      return;
    }

    if (
      normalized.length >
      maximumLength
    ) {
      setError(
        `Máximo ${maximumLength} caracteres.`,
      );

      return;
    }

    if (
      values.length >=
      maximumItems
    ) {
      setError(
        `Puedes añadir hasta ${maximumItems}.`,
      );

      return;
    }

    const exists =
      values.some(
        (value) =>
          value.localeCompare(
            normalized,
            "es",
            {
              sensitivity:
                "base",
            },
          ) === 0,
      );

    if (exists) {
      setCurrentValue(
        "",
      );

      setError(
        "Ese valor ya está añadido.",
      );

      return;
    }

    onChange([
      ...values,
      normalized,
    ]);

    setCurrentValue(
      "",
    );

    setError(
      null,
    );
  }

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key ===
      "Enter" ||
      event.key ===
      ","
    ) {
      event.preventDefault();

      addValue();
    }

    if (
      event.key ===
      "Backspace" &&
      !currentValue &&
      values.length >
      0
    ) {
      onChange(
        values.slice(
          0,
          -1,
        ),
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-black text-slate-900">
          {label}
        </label>

        <span className="text-xs font-bold text-slate-400">
          {values.length}/
          {maximumItems}
        </span>
      </div>

      <div className="mt-2 rounded-2xl border border-slate-200 bg-[#FBFCFE] px-3 py-3 transition focus-within:border-[#5D5FEF] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#5D5FEF]/10">
        {values.length >
          0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {values.map(
              (value) => (
                <span
                  key={
                    value
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F0FF] px-3 py-1.5 text-xs font-extrabold text-[#5052D9]"
                >
                  {value}

                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        values.filter(
                          (
                            item,
                          ) =>
                            item !==
                            value,
                        ),
                      )
                    }
                    aria-label={`Eliminar ${value}`}
                  >
                    <X
                      size={13}
                    />
                  </button>
                </span>
              ),
            )}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Plus
            size={16}
            className="text-slate-400"
          />

          <input
            value={
              currentValue
            }
            onChange={(
              inputEvent,
            ) => {
              setCurrentValue(
                inputEvent
                  .target
                  .value,
              );

              setError(
                null,
              );
            }}
            onKeyDown={
              handleKeyDown
            }
            onBlur={
              addValue
            }
            placeholder={
              placeholder
            }
            maxLength={
              maximumLength
            }
            disabled={
              values.length >=
              maximumItems
            }
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-bold text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EditEventForm({
  accessToken,
  event,
  onSaved,
  onClose,
}: EditEventFormProps) {
  const [
    form,
    setForm,
  ] =
    useState<EventFormState>(
      () =>
        createInitialState(
          event,
        ),
    );

  const [
    categories,
    setCategories,
  ] =
    useState<
      EventCategory[]
    >([]);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] =
    useState(true);

  const [
    categoriesError,
    setCategoriesError,
  ] =
    useState<
      string | null
    >(null);

  const [
    provinces,
    setProvinces,
  ] =
    useState<
      SpainProvince[]
    >([]);

  const [
    provincesLoading,
    setProvincesLoading,
  ] =
    useState(true);

  const [
    provincesError,
    setProvincesError,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedProvinceCode,
    setSelectedProvinceCode,
  ] =
    useState("");

  const [
    municipalities,
    setMunicipalities,
  ] =
    useState<
      SpainMunicipality[]
    >([]);

  const [
    municipalitiesLoading,
    setMunicipalitiesLoading,
  ] =
    useState(false);

  const [
    municipalitiesError,
    setMunicipalitiesError,
  ] =
    useState<
      string | null
    >(null);

  const [
    municipalityMenuOpen,
    setMunicipalityMenuOpen,
  ] =
    useState(false);

  const [
    minimumStartAt,
    setMinimumStartAt,
  ] =
    useState(
      () =>
        toLocalDateTimeInput(
          getMinimumStartDate(),
        ),
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saveError,
    setSaveError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    const refresh =
      () => {
        setMinimumStartAt(
          toLocalDateTimeInput(
            getMinimumStartDate(),
          ),
        );
      };

    const intervalId =
      window.setInterval(
        refresh,
        60 * 1000,
      );

    return () =>
      window.clearInterval(
        intervalId,
      );
  }, []);

  useEffect(() => {
    let mounted =
      true;

    async function load() {
      try {
        const result =
          await getEventCategories();

        if (mounted) {
          setCategories(
            result,
          );
        }
      } catch (
      loadError
      ) {
        if (mounted) {
          setCategoriesError(
            loadError instanceof
              Error
              ? loadError.message
              : "No se pudieron cargar las categorías.",
          );
        }
      } finally {
        if (mounted) {
          setCategoriesLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      mounted =
        false;
    };
  }, []);

  useEffect(() => {
    let mounted =
      true;

    async function load() {
      try {
        const result =
          await getSpainProvinces();

        if (!mounted) {
          return;
        }

        const sorted =
          [...result].sort(
            (
              a,
              b,
            ) =>
              a.name.localeCompare(
                b.name,
                "es",
                {
                  sensitivity:
                    "base",
                },
              ),
          );

        setProvinces(
          sorted,
        );

        const provinceKey =
          normalizeLocationSearch(
            event.province ??
            "",
          );

        const match =
          sorted.find(
            (
              province,
            ) =>
              province.searchKey ===
              provinceKey,
          );

        if (match) {
          setSelectedProvinceCode(
            match.code,
          );

          setForm(
            (current) => ({
              ...current,

              province:
                match.name,
            }),
          );
        }
      } catch (
      loadError
      ) {
        if (mounted) {
          setProvincesError(
            loadError instanceof
              Error
              ? loadError.message
              : "No se pudo cargar el catálogo de provincias.",
          );
        }
      } finally {
        if (mounted) {
          setProvincesLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      mounted =
        false;
    };
  }, [
    event.province,
  ]);

  useEffect(() => {
    if (
      !selectedProvinceCode
    ) {
      setMunicipalities(
        [],
      );

      return;
    }

    let mounted =
      true;

    async function load() {
      setMunicipalitiesLoading(
        true,
      );

      setMunicipalitiesError(
        null,
      );

      try {
        const result =
          await getSpainMunicipalities(
            selectedProvinceCode,
          );

        if (!mounted) {
          return;
        }

        setMunicipalities(
          result,
        );

        const cityKey =
          normalizeLocationSearch(
            form.city,
          );

        const match =
          result.find(
            (
              municipality,
            ) =>
              municipality.searchKey ===
              cityKey,
          );

        if (match) {
          setForm(
            (current) => ({
              ...current,

              city:
                match.name,
            }),
          );
        }
      } catch (
      loadError
      ) {
        if (mounted) {
          setMunicipalities(
            [],
          );

          setMunicipalitiesError(
            loadError instanceof
              Error
              ? loadError.message
              : "No se pudieron cargar los municipios.",
          );
        }
      } finally {
        if (mounted) {
          setMunicipalitiesLoading(
            false,
          );
        }
      }
    }

    void load();

    return () => {
      mounted =
        false;
    };

    // Solo cambia cuando cambia la provincia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedProvinceCode,
  ]);

  const selectedProvince =
    useMemo(
      () =>
        provinces.find(
          (
            province,
          ) =>
            province.code ===
            selectedProvinceCode,
        ) ??
        null,
      [
        provinces,
        selectedProvinceCode,
      ],
    );

  const selectedMunicipality =
    useMemo(
      () => {
        const key =
          normalizeLocationSearch(
            form.city,
          );

        return (
          municipalities.find(
            (
              municipality,
            ) =>
              municipality.searchKey ===
              key,
          ) ??
          null
        );
      },
      [
        municipalities,
        form.city,
      ],
    );

  const filteredMunicipalities =
    useMemo(
      () => {
        const query =
          normalizeLocationSearch(
            form.city,
          );

        if (!query) {
          return municipalities.slice(
            0,
            60,
          );
        }

        return municipalities
          .filter(
            (
              municipality,
            ) =>
              municipality.searchKey.includes(
                query,
              ),
          )
          .sort(
            (
              a,
              b,
            ) => {
              const aStarts =
                a.searchKey.startsWith(
                  query,
                )
                  ? 0
                  : 1;

              const bStarts =
                b.searchKey.startsWith(
                  query,
                )
                  ? 0
                  : 1;

              if (
                aStarts !==
                bStarts
              ) {
                return (
                  aStarts -
                  bStarts
                );
              }

              return a.name.localeCompare(
                b.name,
                "es",
              );
            },
          )
          .slice(
            0,
            60,
          );
      },
      [
        municipalities,
        form.city,
      ],
    );

  const minimumEndAt =
    form.startAt ||
    minimumStartAt;

  function updateField<
    Key extends keyof EventFormState,
  >(
    key: Key,
    value:
      EventFormState[Key],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    );

    setSaveError(
      null,
    );
  }

  function handleProvinceChange(
    code: string,
  ) {
    const province =
      provinces.find(
        (item) =>
          item.code ===
          code,
      );

    setSelectedProvinceCode(
      code,
    );

    setMunicipalityMenuOpen(
      false,
    );

    setForm(
      (current) => ({
        ...current,

        province:
          province?.name ??
          "",

        city:
          "",
      }),
    );

    setSaveError(
      null,
    );
  }

  function handleStartChange(
    value: string,
  ) {
    setForm(
      (current) => {
        const nextStart =
          new Date(value);

        const currentEnd =
          new Date(
            current.endAt,
          );

        if (
          Number.isNaN(
            nextStart.getTime(),
          )
        ) {
          return {
            ...current,

            startAt:
              value,
          };
        }

        if (
          !Number.isNaN(
            currentEnd.getTime(),
          ) &&
          currentEnd.getTime() >
          nextStart.getTime()
        ) {
          return {
            ...current,

            startAt:
              value,
          };
        }

        const nextEnd =
          new Date(
            nextStart.getTime() +
            DEFAULT_EVENT_DURATION_HOURS *
            60 *
            60 *
            1000,
          );

        return {
          ...current,

          startAt:
            value,

          endAt:
            toLocalDateTimeInput(
              nextEnd,
            ),
        };
      },
    );

    setSaveError(
      null,
    );
  }

  async function handleSubmit(
    submitEvent:
      FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault();

    if (saving) {
      return;
    }

    setSaveError(
      null,
    );

    try {
      if (
        !selectedProvince
      ) {
        throw new Error(
          "Selecciona una provincia oficial del catálogo.",
        );
      }

      if (
        municipalitiesLoading
      ) {
        throw new Error(
          "Espera a que termine de cargar el municipio.",
        );
      }

      if (
        !selectedMunicipality
      ) {
        setMunicipalityMenuOpen(
          true,
        );

        throw new Error(
          "Selecciona un municipio válido de la provincia elegida.",
        );
      }

      const input:
        EventDraftCreateInput =
      {
        title:
          form.title,

        description:
          form.description,

        category:
          form.category,

        tags:
          form.tags,

        audience:
          form.audience,

        venueName:
          form.venueName,

        address:
          form.address,

        city:
          selectedMunicipality.name,

        province:
          selectedProvince.name,

        postalCode:
          form.postalCode.trim() ||
          null,

        startAt:
          toIsoDateTime(
            form.startAt,
            "La fecha de inicio",
          ),

        endAt:
          toIsoDateTime(
            form.endAt,
            "La fecha de finalización",
          ),

        isFree:
          form.isFree,

        priceFrom:
          form.isFree
            ? null
            : toNullableNumber(
              form.priceFrom,
            ),

        externalUrl:
          normalizeExternalUrl(
            form.externalUrl,
          ),

        externalActionLabel:
          form.externalActionLabel.trim() ||
          null,

        capacity:
          toNullableNumber(
            form.capacity,
          ),
      };

      parseEventDraftCreateInput(
        input,
      );

      setSaving(
        true,
      );

      const updated =
        await updateEvent(
          accessToken,
          event.id,
          input,
        );

      onSaved(
        updated,
      );
    } catch (
    submitError
    ) {
      setSaveError(
        submitError instanceof
          EventValidationError ||
          submitError instanceof
          Error
          ? submitError.message
          : "No se pudo actualizar el evento.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/30 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-[#F7F8FC] shadow-2xl sm:my-4 sm:h-[calc(100%-2rem)] sm:overflow-hidden sm:rounded-[2rem]">
        <header className="border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft
                size={20}
              />
            </button>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                Editar evento
              </p>

              <h1 className="text-xl font-black text-slate-950">
                Actualiza la experiencia
              </h1>
            </div>
          </div>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="space-y-5">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">
                  Propuesta
                </h2>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-sm font-black text-slate-900">
                      Título
                    </label>

                    <input
                      value={
                        form.title
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "title",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      minLength={
                        EVENT_LIMITS.titleMin
                      }
                      maxLength={
                        EVENT_LIMITS.titleMax
                      }
                      required
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-900">
                      Descripción
                    </label>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "description",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      minLength={
                        EVENT_LIMITS.descriptionMin
                      }
                      maxLength={
                        EVENT_LIMITS.descriptionMax
                      }
                      rows={6}
                      required
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 text-sm font-medium leading-6 text-slate-950 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-900">
                      Categoría
                    </label>

                    {categoriesLoading ? (
                      <div className="mt-2 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />

                        Cargando…
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={
                            form.category
                          }
                          onChange={(
                            inputEvent,
                          ) =>
                            updateField(
                              "category",
                              inputEvent
                                .target
                                .value,
                            )
                          }
                          required
                          className={`${INPUT_CLASS} appearance-none pr-11`}
                        >
                          {categories.map(
                            (
                              category,
                            ) => (
                              <option
                                key={
                                  category.slug
                                }
                                value={
                                  category.slug
                                }
                              >
                                {
                                  category.name
                                }
                              </option>
                            ),
                          )}
                        </select>

                        <ChevronRight
                          size={18}
                          className="pointer-events-none absolute bottom-4 right-4 rotate-90 text-slate-400"
                        />
                      </div>
                    )}

                    {categoriesError ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {
                          categoriesError
                        }
                      </p>
                    ) : null}
                  </div>

                  <TokenField
                    label="Etiquetas"
                    placeholder="IA, networking…"
                    values={
                      form.tags
                    }
                    maximumItems={
                      EVENT_LIMITS.tagsMax
                    }
                    maximumLength={
                      EVENT_LIMITS.tagMax
                    }
                    onChange={(
                      values,
                    ) =>
                      updateField(
                        "tags",
                        values,
                      )
                    }
                  />

                  <TokenField
                    label="¿Para quién es?"
                    placeholder="Emprendedores, estudiantes…"
                    values={
                      form.audience
                    }
                    maximumItems={
                      EVENT_LIMITS.audiencesMax
                    }
                    maximumLength={
                      EVENT_LIMITS.audienceMax
                    }
                    onChange={(
                      values,
                    ) =>
                      updateField(
                        "audience",
                        values,
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPin
                    size={20}
                    className="text-[#5D5FEF]"
                  />

                  <h2 className="text-lg font-black text-slate-950">
                    Ubicación
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-black text-slate-900">
                      Lugar
                    </label>

                    <input
                      value={
                        form.venueName
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "venueName",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      required
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-black text-slate-900">
                      Dirección
                    </label>

                    <input
                      value={
                        form.address
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "address",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      required
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-900">
                      Provincia
                    </label>

                    {provincesLoading ? (
                      <div className="mt-2 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                        Cargando…
                      </div>
                    ) : (
                      <select
                        value={
                          selectedProvinceCode
                        }
                        onChange={(
                          inputEvent,
                        ) =>
                          handleProvinceChange(
                            inputEvent
                              .target
                              .value,
                          )
                        }
                        required
                        className={`${INPUT_CLASS} appearance-none`}
                      >
                        <option value="">
                          Selecciona provincia
                        </option>

                        {provinces.map(
                          (
                            province,
                          ) => (
                            <option
                              key={
                                province.code
                              }
                              value={
                                province.code
                              }
                            >
                              {
                                province.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    )}

                    {provincesError ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {
                          provincesError
                        }
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-900">
                      Municipio
                    </label>

                    <div className="relative mt-2">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={
                          form.city
                        }
                        onChange={(
                          inputEvent,
                        ) => {
                          updateField(
                            "city",
                            inputEvent
                              .target
                              .value,
                          );

                          setMunicipalityMenuOpen(
                            true,
                          );
                        }}
                        onFocus={() =>
                          setMunicipalityMenuOpen(
                            true,
                          )
                        }
                        onBlur={() =>
                          window.setTimeout(
                            () =>
                              setMunicipalityMenuOpen(
                                false,
                              ),
                            120,
                          )
                        }
                        disabled={
                          !selectedProvinceCode ||
                          municipalitiesLoading
                        }
                        role="combobox"
                        aria-expanded={
                          municipalityMenuOpen
                        }
                        aria-controls="edit-event-municipality-list"
                        aria-autocomplete="list"
                        autoComplete="off"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10"
                      />

                      {municipalityMenuOpen &&
                        selectedProvinceCode &&
                        !municipalitiesLoading ? (
                        <div
                          id="edit-event-municipality-list"
                          role="listbox"
                          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                        >
                          {filteredMunicipalities.map(
                            (
                              municipality,
                            ) => (
                              <button
                                key={
                                  municipality.ineCode
                                }
                                type="button"
                                role="option"
                                aria-selected={
                                  selectedMunicipality?.ineCode ===
                                  municipality.ineCode
                                }
                                onMouseDown={(
                                  mouseEvent,
                                ) => {
                                  mouseEvent.preventDefault();

                                  updateField(
                                    "city",
                                    municipality.name,
                                  );

                                  setMunicipalityMenuOpen(
                                    false,
                                  );
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${selectedMunicipality?.ineCode ===
                                  municipality.ineCode
                                  ? "bg-[#F0F0FF] font-black text-[#5052D9]"
                                  : "font-semibold text-slate-700 hover:bg-slate-50"
                                  }`}
                              >
                                {
                                  municipality.name
                                }

                                {selectedMunicipality?.ineCode ===
                                  municipality.ineCode ? (
                                  <Check
                                    size={15}
                                  />
                                ) : null}
                              </button>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>

                    {municipalitiesLoading ? (
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <LoaderCircle
                          size={12}
                          className="animate-spin"
                        />

                        Cargando municipios…
                      </p>
                    ) : municipalitiesError ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {
                          municipalitiesError
                        }
                      </p>
                    ) : selectedMunicipality ? (
                      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <Check
                          size={12}
                        />

                        Municipio oficial seleccionado
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-900">
                      Código postal
                      <span className="ml-1 font-medium text-slate-400">
                        opcional
                      </span>
                    </label>

                    <input
                      value={
                        form.postalCode
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "postalCode",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      maxLength={
                        EVENT_LIMITS.postalCodeMax
                      }
                      inputMode="numeric"
                      className={
                        INPUT_CLASS
                      }
                    />
                    <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                      Si lo dejas vacío, LookUp intentará obtenerlo al verificar la dirección.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <CalendarClock
                    size={20}
                    className="text-[#5D5FEF]"
                  />

                  <h2 className="text-lg font-black text-slate-950">
                    Fecha y hora
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-black">
                      Empieza
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.startAt
                      }
                      min={
                        minimumStartAt
                      }
                      step={
                        DATE_TIME_STEP_MINUTES *
                        60
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        handleStartChange(
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      required
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black">
                      Termina
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.endAt
                      }
                      min={
                        minimumEndAt
                      }
                      step={
                        DATE_TIME_STEP_MINUTES *
                        60
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "endAt",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      required
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Ticket
                    size={20}
                    className="text-[#5D5FEF]"
                  />

                  <h2 className="text-lg font-black text-slate-950">
                    Acceso
                  </h2>
                </div>

                <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "isFree",
                        true,
                      )
                    }
                    className={`rounded-xl p-3 text-sm font-black ${form.isFree
                      ? "bg-white text-[#5D5FEF] shadow-sm"
                      : "text-slate-500"
                      }`}
                  >
                    Gratis
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "isFree",
                        false,
                      )
                    }
                    className={`rounded-xl p-3 text-sm font-black ${!form.isFree
                      ? "bg-white text-[#5D5FEF] shadow-sm"
                      : "text-slate-500"
                      }`}
                  >
                    De pago
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {!form.isFree ? (
                    <div>
                      <label className="text-sm font-black">
                        Precio desde
                      </label>

                      <div className="relative">
                        <CircleDollarSign
                          size={17}
                          className="absolute bottom-4 left-4 text-slate-400"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.priceFrom
                          }
                          onChange={(
                            inputEvent,
                          ) =>
                            updateField(
                              "priceFrom",
                              inputEvent
                                .target
                                .value,
                            )
                          }
                          required
                          className={`${INPUT_CLASS} pl-11`}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label className="text-sm font-black">
                      <Users
                        size={15}
                        className="mr-1 inline"
                      />
                      Aforo
                    </label>

                    <input
                      type="number"
                      min="1"
                      max={
                        EVENT_LIMITS.capacityMax
                      }
                      value={
                        form.capacity
                      }
                      onChange={(
                        inputEvent,
                      ) =>
                        updateField(
                          "capacity",
                          inputEvent
                            .target
                            .value,
                        )
                      }
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <label className="text-sm font-black">
                    Enlace externo
                  </label>

                  <input
                    type="text"
                    inputMode="url"
                    value={
                      form.externalUrl
                    }
                    onChange={(
                      inputEvent,
                    ) =>
                      updateField(
                        "externalUrl",
                        inputEvent
                          .target
                          .value,
                      )
                    }
                    placeholder="www.ejemplo.com"
                    className={
                      INPUT_CLASS
                    }
                  />

                  {form.externalUrl.trim() ? (
                    <div className="mt-4">
                      <label className="text-sm font-black">
                        Texto del botón
                      </label>

                      <input
                        value={
                          form.externalActionLabel
                        }
                        onChange={(
                          inputEvent,
                        ) =>
                          updateField(
                            "externalActionLabel",
                            inputEvent
                              .target
                              .value,
                          )
                        }
                        maxLength={
                          EVENT_LIMITS.externalActionLabelMax
                        }
                        className={
                          INPUT_CLASS
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              <div className="rounded-2xl bg-[#F0F0FF] p-4 text-sm font-semibold leading-6 text-[#494BC8]">
                Al guardar cambios, cualquier análisis pre-publicación anterior se invalidará para evitar consejos desactualizados.
              </div>

              {saveError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"
                >
                  {saveError}
                </div>
              ) : null}
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-600"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  categoriesLoading ||
                  provincesLoading ||
                  municipalitiesLoading ||
                  !selectedMunicipality
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={18}
                  />
                )}

                {saving
                  ? "Verificando y guardando…"
                  : "Guardar cambios"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}