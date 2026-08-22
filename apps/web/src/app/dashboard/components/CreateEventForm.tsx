"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
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
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

import {
  EVENT_LIMITS,
  EventValidationError,
  parseEventDraftCreateInput,
  type CreatedEventDraft,
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
  createEventDraft,
} from "@/services/events/create-event-draft";

import {
  getEventCategories,
  type EventCategory,
} from "@/services/events/get-event-categories";

type CreateEventFormProps = {
  accessToken: string;
  defaultCity?: string;
  defaultProvince?: string;

  onCreated: (
    draft: CreatedEventDraft,
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
  description: string;
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
  date: Date,
) {
  return [
    date.getFullYear(),
    "-",
    padNumber(
      date.getMonth() + 1,
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
    new Date(
      date,
    );

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

function getMinimumStartDate(
  now = new Date(),
) {
  const withLead =
    new Date(
      now.getTime() +
      MINIMUM_START_LEAD_MINUTES *
      60 *
      1000,
    );

  return roundUpToInterval(
    withLead,
    DATE_TIME_STEP_MINUTES,
  );
}

function createInitialDates() {
  const start =
    getMinimumStartDate();

  const end =
    new Date(
      start.getTime() +
      DEFAULT_EVENT_DURATION_HOURS *
      60 *
      60 *
      1000,
    );

  return {
    startAt:
      toLocalDateTimeInput(
        start,
      ),

    endAt:
      toLocalDateTimeInput(
        end,
      ),
  };
}

function createInitialState(
  defaultCity: string,
  defaultProvince: string,
): EventFormState {
  const dates =
    createInitialDates();

  return {
    title: "",
    description: "",
    category: "",

    tags: [],
    audience: [],

    venueName: "",
    address: "",

    city:
      defaultCity.trim(),

    province:
      defaultProvince.trim(),

    postalCode: "",

    startAt:
      dates.startAt,

    endAt:
      dates.endAt,

    isFree: true,
    priceFrom: "",

    capacity: "",

    externalUrl: "",
    externalActionLabel: "",
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
    new Date(
      value,
    );

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
  description,
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
    event: KeyboardEvent<HTMLInputElement>,
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
      values.length > 0
    ) {
      onChange(
        values.slice(
          0,
          -1,
        ),
      );
    }
  }

  function removeValue(
    valueToRemove: string,
  ) {
    onChange(
      values.filter(
        (value) =>
          value !==
          valueToRemove,
      ),
    );

    setError(
      null,
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <label className="text-sm font-black text-slate-900">
            {label}
          </label>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-slate-400">
          {values.length}/
          {maximumItems}
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 transition focus-within:border-[#5D5FEF] focus-within:ring-4 focus-within:ring-[#5D5FEF]/10">
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
                    aria-label={`Eliminar ${value}`}
                    onClick={() =>
                      removeValue(
                        value,
                      )
                    }
                    className="rounded-full p-0.5 transition hover:bg-[#5D5FEF]/10"
                  >
                    <X
                      size={
                        13
                      }
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
            className="shrink-0 text-slate-400"
          />

          <input
            value={
              currentValue
            }
            onChange={(
              event,
            ) => {
              setCurrentValue(
                event.target
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
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
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

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
        {icon}
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export function CreateEventForm({
  accessToken,
  defaultCity = "",
  defaultProvince = "",
  onCreated,
  onClose,
}: CreateEventFormProps) {
  const [
    form,
    setForm,
  ] =
    useState<EventFormState>(
      () =>
        createInitialState(
          defaultCity,
          defaultProvince,
        ),
    );

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
    const refreshMinimum =
      () => {
        setMinimumStartAt(
          toLocalDateTimeInput(
            getMinimumStartDate(),
          ),
        );
      };

    refreshMinimum();

    const intervalId =
      window.setInterval(
        refreshMinimum,
        60 * 1000,
      );

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, []);

  useEffect(() => {
    let mounted =
      true;

    async function loadCategories() {
      setCategoriesLoading(
        true,
      );

      setCategoriesError(
        null,
      );

      try {
        const result =
          await getEventCategories();

        if (!mounted) {
          return;
        }

        setCategories(
          result,
        );

        if (
          result.length ===
          0
        ) {
          setCategoriesError(
            "No hay categorías disponibles en este momento.",
          );
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setCategories(
          [],
        );

        setCategoriesError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las categorías.",
        );
      } finally {
        if (mounted) {
          setCategoriesLoading(
            false,
          );
        }
      }
    }

    void loadCategories();

    return () => {
      mounted =
        false;
    };
  }, []);

  useEffect(() => {
    let mounted =
      true;

    async function loadProvinces() {
      setProvincesLoading(
        true,
      );

      setProvincesError(
        null,
      );

      try {
        const result =
          await getSpainProvinces();

        if (!mounted) {
          return;
        }

        const sorted =
          [...result].sort(
            (a, b) =>
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

        const normalizedDefault =
          normalizeLocationSearch(
            defaultProvince,
          );

        if (
          normalizedDefault
        ) {
          const match =
            sorted.find(
              (province) =>
                province.searchKey ===
                normalizedDefault,
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
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setProvinces(
          [],
        );

        setProvincesError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el catálogo de provincias.",
        );
      } finally {
        if (mounted) {
          setProvincesLoading(
            false,
          );
        }
      }
    }

    void loadProvinces();

    return () => {
      mounted =
        false;
    };
  }, [
    defaultProvince,
  ]);

  useEffect(() => {
    if (
      !selectedProvinceCode
    ) {
      setMunicipalities(
        [],
      );

      setMunicipalitiesLoading(
        false,
      );

      return;
    }

    let mounted =
      true;

    async function loadMunicipalities() {
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

        const currentCityKey =
          normalizeLocationSearch(
            form.city,
          );

        if (
          currentCityKey
        ) {
          const exactMatch =
            result.find(
              (municipality) =>
                municipality.searchKey ===
                currentCityKey,
            );

          if (
            exactMatch
          ) {
            setForm(
              (current) => ({
                ...current,
                city:
                  exactMatch.name,
              }),
            );
          }
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMunicipalities(
          [],
        );

        setMunicipalitiesError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los municipios.",
        );
      } finally {
        if (mounted) {
          setMunicipalitiesLoading(
            false,
          );
        }
      }
    }

    void loadMunicipalities();

    return () => {
      mounted =
        false;
    };
    // Solo debe recargarse cuando cambia la provincia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedProvinceCode,
  ]);

  const selectedCategory =
    useMemo(
      () =>
        categories.find(
          (category) =>
            category.slug ===
            form.category,
        ) ??
        null,
      [
        categories,
        form.category,
      ],
    );

  const selectedProvince =
    useMemo(
      () =>
        provinces.find(
          (province) =>
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

        if (!key) {
          return null;
        }

        return (
          municipalities.find(
            (municipality) =>
              municipality.searchKey ===
              key,
          ) ??
          null
        );
      },
      [
        form.city,
        municipalities,
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
            (municipality) =>
              municipality.searchKey.includes(
                query,
              ),
          )
          .sort(
            (a, b) => {
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
                {
                  sensitivity:
                    "base",
                },
              );
            },
          )
          .slice(
            0,
            60,
          );
      },
      [
        form.city,
        municipalities,
      ],
    );

  const minimumEndAt =
    form.startAt.trim()
      ? form.startAt
      : minimumStartAt;

  function updateField<
    Key extends keyof EventFormState,
  >(
    key: Key,
    value: EventFormState[Key],
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
    provinceCode: string,
  ) {
    const province =
      provinces.find(
        (item) =>
          item.code ===
          provinceCode,
      );

    setSelectedProvinceCode(
      provinceCode,
    );

    setMunicipalityMenuOpen(
      false,
    );

    setMunicipalitiesError(
      null,
    );

    setSaveError(
      null,
    );

    setForm(
      (current) => ({
        ...current,

        province:
          province?.name ??
          "",

        city: "",
      }),
    );
  }

  function handleMunicipalityChange(
    value: string,
  ) {
    updateField(
      "city",
      value,
    );

    setMunicipalityMenuOpen(
      true,
    );
  }

  function selectMunicipality(
    municipality: SpainMunicipality,
  ) {
    updateField(
      "city",
      municipality.name,
    );

    setMunicipalityMenuOpen(
      false,
    );
  }

  function handleStartAtChange(
    value: string,
  ) {
    setForm(
      (current) => {
        if (!value) {
          return {
            ...current,
            startAt:
              value,
          };
        }

        const nextStart =
          new Date(
            value,
          );

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

        const endNeedsUpdate =
          Number.isNaN(
            currentEnd.getTime(),
          ) ||
          currentEnd.getTime() <=
          nextStart.getTime();

        if (
          !endNeedsUpdate
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
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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
        setSaveError(
          "Selecciona una provincia oficial del catálogo.",
        );

        return;
      }

      if (
        municipalitiesLoading
      ) {
        setSaveError(
          "Espera a que termine de cargar el municipio.",
        );

        return;
      }

      if (
        !selectedMunicipality
      ) {
        setSaveError(
          "Selecciona un municipio válido de la provincia elegida.",
        );

        setMunicipalityMenuOpen(
          true,
        );

        return;
      }

      const startAt =
        toIsoDateTime(
          form.startAt,
          "La fecha de inicio",
        );

      const endAt =
        toIsoDateTime(
          form.endAt,
          "La fecha de finalización",
        );

      const priceFrom =
        form.isFree
          ? null
          : toNullableNumber(
            form.priceFrom,
          );

      const capacity =
        toNullableNumber(
          form.capacity,
        );
      const externalUrl =
        normalizeExternalUrl(
          form.externalUrl,
        );
      const input: EventDraftCreateInput =
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

        startAt,
        endAt,

        isFree:
          form.isFree,

        priceFrom,

        externalUrl,

        externalActionLabel:
          form.externalActionLabel.trim() ||
          null,

        capacity,
      };

      /*
       * La UI reutiliza el dominio del servidor para ofrecer
       * feedback inmediato.
       *
       * La API vuelve a validar toda la información y continúa
       * siendo la autoridad de seguridad.
       */
      parseEventDraftCreateInput(
        input,
      );

      setSaving(
        true,
      );

      const draft =
        await createEventDraft(
          accessToken,
          input,
        );

      onCreated(
        draft,
      );
    } catch (error) {
      if (
        error instanceof
        EventValidationError
      ) {
        setSaveError(
          error.message,
        );

        return;
      }

      if (
        error instanceof
        Error
      ) {
        setSaveError(
          error.message,
        );

        return;
      }

      console.error(
        "❌ Error inesperado creando evento",
        error,
      );

      setSaveError(
        "No se pudo guardar el evento.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/30 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-[#F7F8FC] shadow-2xl sm:my-4 sm:h-[calc(100%-2rem)] sm:overflow-hidden sm:rounded-[2rem]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Cerrar creación de evento"
            >
              <ArrowLeft
                size={20}
              />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5D5FEF]">
                Nuevo evento
              </p>

              <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                Crea algo que valga la pena descubrir
              </h1>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-[#F0F0FF] px-3 py-2 text-xs font-extrabold text-[#5557D8] sm:flex">
              <Sparkles
                size={14}
              />
              Intelligence después
            </div>
          </div>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={
                    <Sparkles
                      size={
                        20
                      }
                    />
                  }
                  eyebrow="01 · Propuesta"
                  title="¿Qué va a pasar?"
                  description="Haz que cualquier persona entienda la experiencia en pocos segundos."
                />

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="event-title"
                        className="text-sm font-black text-slate-900"
                      >
                        Título
                      </label>

                      <span className="text-xs font-bold text-slate-400">
                        {
                          form
                            .title
                            .length
                        }
                        /
                        {
                          EVENT_LIMITS.titleMax
                        }
                      </span>
                    </div>

                    <input
                      id="event-title"
                      value={
                        form.title
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "title",
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      minLength={
                        EVENT_LIMITS.titleMin
                      }
                      maxLength={
                        EVENT_LIMITS.titleMax
                      }
                      spellCheck
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      placeholder="Ej. Encuentro de IA y proyectos locales"
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="event-description"
                        className="text-sm font-black text-slate-900"
                      >
                        Descripción
                      </label>

                      <span className="text-xs font-bold text-slate-400">
                        {
                          form
                            .description
                            .length
                        }
                        /
                        {
                          EVENT_LIMITS.descriptionMax
                        }
                      </span>
                    </div>

                    <textarea
                      id="event-description"
                      value={
                        form.description
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "description",
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      minLength={
                        EVENT_LIMITS.descriptionMin
                      }
                      maxLength={
                        EVENT_LIMITS.descriptionMax
                      }
                      spellCheck
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      rows={6}
                      placeholder="Explica qué encontrará la gente, qué podrá hacer y por qué puede interesarle."
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 text-sm font-medium leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10"
                    />

                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Mínimo{" "}
                      {
                        EVENT_LIMITS.descriptionMin
                      }{" "}
                      caracteres.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="event-category"
                      className="text-sm font-black text-slate-900"
                    >
                      Categoría
                    </label>

                    {categoriesLoading ? (
                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-4 text-sm font-semibold text-slate-500">
                        <LoaderCircle
                          size={
                            17
                          }
                          className="animate-spin"
                        />

                        Cargando categorías…
                      </div>
                    ) : (
                      <div className="relative mt-2">
                        <select
                          id="event-category"
                          value={
                            form.category
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              "category",
                              event
                                .target
                                .value,
                            )
                          }
                          required
                          disabled={
                            categories.length ===
                            0
                          }
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 pr-11 text-sm font-bold text-slate-950 outline-none transition focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            Selecciona una categoría
                          </option>

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
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                        />
                      </div>
                    )}

                    {categoriesError ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {
                          categoriesError
                        }
                      </p>
                    ) : selectedCategory ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {
                          selectedCategory.description
                        }
                      </p>
                    ) : null}
                  </div>

                  <TokenField
                    label="Etiquetas"
                    description="Describe el tono y los temas. Puedes escribir con naturalidad; el navegador te ayudará con posibles errores ortográficos."
                    placeholder="Ej. IA, networking…"
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
                    description="Define de forma humana las personas a las que puede aportar valor."
                    placeholder="Ej. emprendedores, estudiantes…"
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

              <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={
                    <MapPin
                      size={
                        20
                      }
                    />
                  }
                  eyebrow="02 · Lugar"
                  title="¿Dónde sucede?"
                  description="Selecciona provincia y municipio del catálogo oficial. LookUp verificará después la dirección exacta."
                />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="event-venue"
                      className="text-sm font-black text-slate-900"
                    >
                      Lugar
                    </label>

                    <input
                      id="event-venue"
                      value={
                        form.venueName
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "venueName",
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      minLength={
                        EVENT_LIMITS.venueNameMin
                      }
                      maxLength={
                        EVENT_LIMITS.venueNameMax
                      }
                      spellCheck
                      autoCorrect="on"
                      autoCapitalize="words"
                      placeholder="Ej. Palacio de la Audiencia"
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="event-address"
                      className="text-sm font-black text-slate-900"
                    >
                      Dirección
                    </label>

                    <input
                      id="event-address"
                      value={
                        form.address
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "address",
                          event
                            .target
                            .value,
                        )
                      }
                      required
                      minLength={
                        EVENT_LIMITS.addressMin
                      }
                      maxLength={
                        EVENT_LIMITS.addressMax
                      }
                      spellCheck
                      autoCorrect="on"
                      autoCapitalize="words"
                      placeholder="Calle, plaza y número"
                      className={
                        INPUT_CLASS
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="event-province"
                      className="text-sm font-black text-slate-900"
                    >
                      Provincia
                    </label>

                    {provincesLoading ? (
                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 text-sm font-semibold text-slate-500">
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />

                        Cargando…
                      </div>
                    ) : (
                      <div className="relative mt-2">
                        <select
                          id="event-province"
                          value={
                            selectedProvinceCode
                          }
                          onChange={(
                            event,
                          ) =>
                            handleProvinceChange(
                              event
                                .target
                                .value,
                            )
                          }
                          required
                          disabled={
                            provinces.length ===
                            0
                          }
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 pr-11 text-sm font-bold text-slate-950 outline-none transition focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            Selecciona provincia
                          </option>

                          {provinces.map(
                            (province) => (
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

                        <ChevronRight
                          size={18}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                        />
                      </div>
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
                    <label
                      htmlFor="event-city"
                      className="text-sm font-black text-slate-900"
                    >
                      Municipio
                    </label>

                    <div className="relative mt-2">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="event-city"
                        value={
                          form.city
                        }
                        onChange={(
                          event,
                        ) =>
                          handleMunicipalityChange(
                            event
                              .target
                              .value,
                          )
                        }
                        onFocus={() =>
                          setMunicipalityMenuOpen(
                            true,
                          )
                        }
                        onBlur={() => {
                          window.setTimeout(
                            () =>
                              setMunicipalityMenuOpen(
                                false,
                              ),
                            120,
                          );
                        }}
                        disabled={
                          !selectedProvinceCode ||
                          municipalitiesLoading
                        }
                        required
                        minLength={
                          EVENT_LIMITS.cityMin
                        }
                        maxLength={
                          EVENT_LIMITS.cityMax
                        }
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={
                          !selectedProvinceCode
                            ? "Primero selecciona provincia"
                            : municipalitiesLoading
                              ? "Cargando municipios…"
                              : "Buscar municipio…"
                        }
                        role="combobox"
                        aria-expanded={
                          municipalityMenuOpen
                        }
                        aria-controls="event-city-options"
                        aria-haspopup="listbox"
                        aria-autocomplete="list"
                        className="w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      {municipalityMenuOpen &&
                        selectedProvinceCode &&
                        !municipalitiesLoading ? (
                        <div
                          id="event-city-options"
                          role="listbox"
                          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                        >
                          {filteredMunicipalities.length >
                            0 ? (
                            filteredMunicipalities.map(
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
                                    event,
                                  ) => {
                                    event.preventDefault();

                                    selectMunicipality(
                                      municipality,
                                    );
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${selectedMunicipality?.ineCode ===
                                    municipality.ineCode
                                    ? "bg-[#F0F0FF] font-black text-[#5052D9]"
                                    : "font-semibold text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                  <span>
                                    {
                                      municipality.name
                                    }
                                  </span>

                                  {selectedMunicipality?.ineCode ===
                                    municipality.ineCode ? (
                                    <Check
                                      size={15}
                                    />
                                  ) : null}
                                </button>
                              ),
                            )
                          ) : (
                            <div className="px-3 py-5 text-center">
                              <p className="text-sm font-bold text-slate-600">
                                No encontramos ese municipio.
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Comprueba el nombre o prueba otra búsqueda.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {municipalitiesLoading ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <LoaderCircle
                          size={13}
                          className="animate-spin"
                        />

                        Cargando municipios de{" "}
                        {
                          selectedProvince?.name
                        }…
                      </p>
                    ) : municipalitiesError ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {
                          municipalitiesError
                        }
                      </p>
                    ) : selectedMunicipality ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <Check
                          size={13}
                        />

                        Municipio oficial seleccionado
                      </p>
                    ) : form.city.trim() ? (
                      <p className="mt-2 text-xs font-semibold text-amber-600">
                        Selecciona uno de los resultados para confirmar el municipio.
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-2 sm:max-w-[14rem]">
                    <label
                      htmlFor="event-postal-code"
                      className="text-sm font-black text-slate-900"
                    >
                      Código postal
                      <span className="ml-1 font-medium text-slate-400">
                        opcional
                      </span>
                    </label>

                    <input
                      id="event-postal-code"
                      value={
                        form.postalCode
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "postalCode",
                          event
                            .target
                            .value,
                        )
                      }
                      maxLength={
                        EVENT_LIMITS.postalCodeMax
                      }
                      placeholder="42002"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className={
                        INPUT_CLASS
                      }
                    />
                    <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                      Si lo dejas vacío, LookUp intentará obtenerlo al verificar la dirección.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 text-amber-950">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <p className="text-xs font-semibold leading-5">
                    Provincia y municipio proceden del catálogo oficial. La dirección se verificará antes de guardar coordenadas para evitar ubicaciones incorrectas.
                  </p>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={
                    <CalendarClock
                      size={
                        20
                      }
                    />
                  }
                  eyebrow="03 · Momento"
                  title="¿Cuándo ocurre?"
                  description="Solo podrás seleccionar horarios futuros. Si cambias el inicio, LookUp mantendrá un final coherente."
                />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="event-start"
                      className="text-sm font-black text-slate-900"
                    >
                      Empieza
                    </label>

                    <input
                      id="event-start"
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
                      required
                      onChange={(
                        event,
                      ) =>
                        handleStartAtChange(
                          event
                            .target
                            .value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 text-sm font-bold text-slate-950 outline-none transition focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10"
                    />

                    <p className="mt-2 text-xs font-medium text-slate-400">
                      El primer horario disponible se calcula con la hora actual.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="event-end"
                      className="text-sm font-black text-slate-900"
                    >
                      Termina
                    </label>

                    <input
                      id="event-end"
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
                      required
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "endAt",
                          event
                            .target
                            .value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] px-4 py-3.5 text-sm font-bold text-slate-950 outline-none transition focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={
                    <Ticket
                      size={
                        20
                      }
                    />
                  }
                  eyebrow="04 · Acceso"
                  title="¿Cómo participa la gente?"
                  description="Precio, aforo y una acción externa si existe una inscripción o información adicional."
                />

                <div className="mt-6">
                  <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "isFree",
                          true,
                        )
                      }
                      className={`rounded-xl px-4 py-3 text-sm font-black transition ${form.isFree
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
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
                      className={`rounded-xl px-4 py-3 text-sm font-black transition ${!form.isFree
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      De pago
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {!form.isFree ? (
                      <div>
                        <label
                          htmlFor="event-price"
                          className="text-sm font-black text-slate-900"
                        >
                          Precio desde
                        </label>

                        <div className="relative mt-2">
                          <CircleDollarSign
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            id="event-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              form.priceFrom
                            }
                            onChange={(
                              event,
                            ) =>
                              updateField(
                                "priceFrom",
                                event
                                  .target
                                  .value,
                              )
                            }
                            required={
                              !form.isFree
                            }
                            placeholder="15.00"
                            className="w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] py-3.5 pl-11 pr-12 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10"
                          />

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                            EUR
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label
                        htmlFor="event-capacity"
                        className="text-sm font-black text-slate-900"
                      >
                        Aforo
                        <span className="ml-1 font-medium text-slate-400">
                          opcional
                        </span>
                      </label>

                      <div className="relative mt-2">
                        <Users
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="event-capacity"
                          type="number"
                          min="1"
                          max={
                            EVENT_LIMITS.capacityMax
                          }
                          step="1"
                          value={
                            form.capacity
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              "capacity",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="40"
                          className="w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] py-3.5 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <label
                      htmlFor="event-external-url"
                      className="text-sm font-black text-slate-900"
                    >
                      Enlace externo
                      <span className="ml-1 font-medium text-slate-400">
                        opcional
                      </span>
                    </label>

                    <input
                      id="event-external-url"
                      type="text"
                      value={
                        form.externalUrl
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "externalUrl",
                          event
                            .target
                            .value,
                        )
                      }
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="https://..."
                      className={
                        INPUT_CLASS
                      }
                    />

                    {form.externalUrl.trim() ? (
                      <div className="mt-4">
                        <label
                          htmlFor="event-action-label"
                          className="text-sm font-black text-slate-900"
                        >
                          Texto del botón
                        </label>

                        <input
                          id="event-action-label"
                          value={
                            form.externalActionLabel
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              "externalActionLabel",
                              event
                                .target
                                .value,
                            )
                          }
                          maxLength={
                            EVENT_LIMITS.externalActionLabelMax
                          }
                          spellCheck
                          autoCorrect="on"
                          autoCapitalize="sentences"
                          placeholder="Ej. Reservar plaza"
                          className={
                            INPUT_CLASS
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-lg sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-violet-300">
                    <Sparkles
                      size={
                        20
                      }
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">
                      Siguiente fase
                    </p>

                    <h2 className="mt-1 text-lg font-black">
                      LookUp Intelligence
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Primero guardaremos un borrador real. Después LookUp podrá analizar su preparación y el potencial local sin inventar información.
                    </p>
                  </div>
                </div>
              </section>

              {saveError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-bold leading-6 text-rose-700"
                >
                  {saveError}
                </div>
              ) : null}
            </div>
          </div>

          <footer className="border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                className="hidden rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:block"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  categoriesLoading ||
                  categories.length ===
                  0 ||
                  provincesLoading ||
                  provinces.length ===
                  0 ||
                  municipalitiesLoading
                }
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />

                    Verificando y guardando…
                  </>
                ) : (
                  <>
                    <Check
                      size={18}
                    />

                    Guardar borrador
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}