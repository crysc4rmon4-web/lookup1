"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import {
  useAuth,
} from "@/components/auth-provider";

import type {
  CreatedEventDraft,
} from "@/lib/events/event-domain";

import {
  getSpainMunicipalities,
  getSpainProvinces,
  normalizeLocationSearch,
  type SpainMunicipality,
  type SpainProvince,
} from "@/lib/locations/spain-locations";

import {
  getExploreEvents,
  type ExploreEvent,
} from "@/services/events/get-explore-events";

import {
  getMyEvents,
  type EventLifecycleStatus,
  type MyEvent,
} from "@/services/events/get-my-events";

export type EventCard = {
  id: string;
  title: string;
  description: string;
  place: string;
  date: string;
  attendees: number;
};

type EventsViewProps = {
  /*
   * Se mantiene temporalmente por compatibilidad
   * con DashboardView.
   *
   * Explorar ya utiliza el feed real.
   */
  events: EventCard[];

  city?: string | null;

  createdDraft?:
  CreatedEventDraft | null;

  onCreateEvent: () => void;

  onJoinEvent: (
    id: string,
  ) => void;
};

type EventsTab =
  | "explore"
  | "saved"
  | "mine";

type MyEventsFilter =
  | "all"
  | EventLifecycleStatus;

const EXPLORE_MUNICIPALITY_LIST_ID =
  "explore-municipality-options";

function getInitialEventsTab(): EventsTab {
  if (
    typeof window ===
    "undefined"
  ) {
    return "explore";
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  const tab =
    params.get(
      "eventsTab",
    );

  if (
    tab === "saved" ||
    tab === "mine"
  ) {
    return tab;
  }

  return "explore";
}

function getInitialExploreCity(
  fallbackCity: string,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return fallbackCity.trim();
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  return (
    params
      .get(
        "eventsCity",
      )
      ?.trim() ||
    fallbackCity.trim()
  );
}

function getInitialExploreProvinceCode() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  const value =
    params
      .get(
        "eventsProvince",
      )
      ?.trim() ??
    "";

  return /^\d{2}$/.test(
    value,
  )
    ? value
    : "";
}

const STATUS_ORDER:
  EventLifecycleStatus[] =
  [
    "draft",
    "upcoming",
    "live",
    "ended",
    "cancelled",
  ];

const STATUS_LABELS:
  Record<
    EventLifecycleStatus,
    string
  > = {
  draft:
    "Borrador",

  upcoming:
    "Próximo",

  live:
    "En curso",

  ended:
    "Finalizado",

  cancelled:
    "Cancelado",
};

function formatEventDate(
  value: string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Fecha pendiente";
  }

  return new Intl.DateTimeFormat(
    "es-ES",
    {
      weekday:
        "short",

      day:
        "numeric",

      month:
        "short",

      hour:
        "2-digit",

      minute:
        "2-digit",

      timeZone:
        "Europe/Madrid",
    },
  ).format(
    date,
  );
}

function getStatusClasses(
  status:
    EventLifecycleStatus,
) {
  switch (
  status
  ) {
    case "draft":
      return "bg-amber-50 text-amber-700";

    case "upcoming":
      return "bg-indigo-50 text-[#5557D8]";

    case "live":
      return "bg-emerald-50 text-emerald-700";

    case "ended":
      return "bg-slate-100 text-slate-600";

    case "cancelled":
      return "bg-rose-50 text-rose-700";
  }
}

function getStatusIcon(
  status:
    EventLifecycleStatus,
) {
  switch (
  status
  ) {
    case "draft":
      return (
        <Clock3
          size={13}
        />
      );

    case "upcoming":
      return (
        <CalendarDays
          size={13}
        />
      );

    case "live":
      return (
        <CircleDot
          size={13}
        />
      );

    case "ended":
      return (
        <Check
          size={13}
        />
      );

    case "cancelled":
      return (
        <Clock3
          size={13}
        />
      );
  }
}

function getExploreStatusLabel(
  event:
    ExploreEvent,
) {
  return event.lifecycleStatus ===
    "live"
    ? "En curso"
    : "Próximo";
}

function getExploreStatusClasses(
  event:
    ExploreEvent,
) {
  return event.lifecycleStatus ===
    "live"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-[#F0F0FF] text-[#5557D8]";
}

function formatExplorePrice(
  event:
    ExploreEvent,
) {
  if (
    event.isFree
  ) {
    return "Gratis";
  }

  if (
    event.priceFrom !==
    null
  ) {
    return `Desde ${event.priceFrom} ${event.currency}`;
  }

  return "De pago";
}

export function EventsView({
  city,
  createdDraft = null,
  onCreateEvent,
  onJoinEvent,
}: EventsViewProps) {
  const {
    session,
  } =
    useAuth();

  const profileCity =
    city?.trim() ??
    "";

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<EventsTab>(
      getInitialEventsTab,
    );

  /*
   * ==========================================================
   * EXPLORE · LOCATION
   * ==========================================================
   */

  const [
    selectedExploreCity,
    setSelectedExploreCity,
  ] =
    useState(
      () =>
        getInitialExploreCity(
          profileCity,
        ),
    );

  const [
    selectedProvinceCode,
    setSelectedProvinceCode,
  ] =
    useState(
      getInitialExploreProvinceCode,
    );

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
    municipalityQuery,
    setMunicipalityQuery,
  ] =
    useState(
      () =>
        getInitialExploreCity(
          profileCity,
        ),
    );

  const [
    selectedMunicipalityCode,
    setSelectedMunicipalityCode,
  ] =
    useState("");

  const [
    municipalityMenuOpen,
    setMunicipalityMenuOpen,
  ] =
    useState(false);
  const [
    hasExploreLocationInteraction,
    setHasExploreLocationInteraction,
  ] =
    useState(false);
  /*
   * ==========================================================
   * EXPLORE · EVENTS
   * ==========================================================
   */

  const [
    exploreEvents,
    setExploreEvents,
  ] =
    useState<
      ExploreEvent[]
    >([]);

  const [
    exploreEventsLoading,
    setExploreEventsLoading,
  ] =
    useState(false);

  const [
    exploreEventsError,
    setExploreEventsError,
  ] =
    useState<
      string | null
    >(null);

  /*
   * ==========================================================
   * MY EVENTS
   * ==========================================================
   */

  const [
    myEvents,
    setMyEvents,
  ] =
    useState<
      MyEvent[]
    >([]);

  const [
    myEventsLoading,
    setMyEventsLoading,
  ] =
    useState(false);

  const [
    myEventsError,
    setMyEventsError,
  ] =
    useState<
      string | null
    >(null);

  const [
    myEventsFilter,
    setMyEventsFilter,
  ] =
    useState<MyEventsFilter>(
      "all",
    );

  const displayCity =
    selectedExploreCity ||
    "la ciudad que elijas";

  /*
   * ==========================================================
   * LOCATION CATALOG
   * ==========================================================
   */

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
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
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
      } catch (
      error
      ) {
        if (!mounted) {
          return;
        }

        setProvinces(
          [],
        );

        setProvincesError(
          error instanceof
            Error
            ? error.message
            : "No se pudieron cargar las provincias.",
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
  }, []);

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

      setMunicipalitiesError(
        null,
      );

      setSelectedMunicipalityCode(
        "",
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

        const sorted =
          [...result].sort(
            (
              first,
              second,
            ) =>
              first.name.localeCompare(
                second.name,
                "es",
                {
                  sensitivity:
                    "base",
                },
              ),
          );

        setMunicipalities(
          sorted,
        );
      } catch (
      error
      ) {
        if (!mounted) {
          return;
        }

        setMunicipalities(
          [],
        );

        setMunicipalitiesError(
          error instanceof
            Error
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
  }, [
    selectedProvinceCode,
  ]);

  /*
 * La ciudad del perfil funciona únicamente como
 * ubicación inicial.
 *
 * Una vez que el usuario empieza a elegir manualmente
 * provincia/municipio, nunca debemos volver a imponer
 * automáticamente la ciudad de su perfil.
 */
  useEffect(() => {
    if (
      !profileCity ||
      selectedExploreCity ||
      selectedProvinceCode ||
      hasExploreLocationInteraction
    ) {
      return;
    }

    setSelectedExploreCity(
      profileCity,
    );

    setMunicipalityQuery(
      profileCity,
    );
  }, [
    profileCity,
    selectedExploreCity,
    selectedProvinceCode,
    hasExploreLocationInteraction,
  ]);

  /*
  * Cuando existe una provincia seleccionada,
  * la ciudad tiene que pertenecer realmente a ella.
  *
  * Esto además sanea URLs antiguas o estados imposibles
  * como:
  *
  * eventsProvince=28&eventsCity=Soria
  *
  * Madrid + Soria nunca debe poder sobrevivir como
  * ubicación válida en Explorar.
  */
  useEffect(() => {
    if (
      !selectedProvinceCode ||
      !selectedExploreCity ||
      municipalities.length ===
      0
    ) {
      return;
    }

    const cityKey =
      normalizeLocationSearch(
        selectedExploreCity,
      );

    const match =
      municipalities.find(
        (
          municipality,
        ) =>
          municipality.searchKey ===
          cityKey,
      );

    if (!match) {
      setSelectedMunicipalityCode(
        "",
      );

      setSelectedExploreCity(
        "",
      );

      setMunicipalityQuery(
        "",
      );

      setExploreEvents(
        [],
      );

      setExploreEventsError(
        null,
      );

      return;
    }

    setSelectedMunicipalityCode(
      match.ineCode,
    );

    if (
      selectedExploreCity !==
      match.name
    ) {
      setSelectedExploreCity(
        match.name,
      );
    }

    if (
      municipalityQuery !==
      match.name
    ) {
      setMunicipalityQuery(
        match.name,
      );
    }
  }, [
    municipalities,
    selectedExploreCity,
    selectedProvinceCode,
    municipalityQuery,
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

  const filteredMunicipalities =
    useMemo(
      () => {
        const query =
          normalizeLocationSearch(
            municipalityQuery,
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
              first,
              second,
            ) => {
              const firstStarts =
                first.searchKey.startsWith(
                  query,
                )
                  ? 0
                  : 1;

              const secondStarts =
                second.searchKey.startsWith(
                  query,
                )
                  ? 0
                  : 1;

              if (
                firstStarts !==
                secondStarts
              ) {
                return (
                  firstStarts -
                  secondStarts
                );
              }

              return first.name.localeCompare(
                second.name,
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
        municipalityQuery,
        municipalities,
      ],
    );

  function handleProvinceChange(
    provinceCode: string,
  ) {
    setHasExploreLocationInteraction(
      true,
    );

    setSelectedProvinceCode(
      provinceCode,
    );

    setSelectedMunicipalityCode(
      "",
    );

    setMunicipalities(
      [],
    );

    setMunicipalitiesError(
      null,
    );

    setMunicipalityQuery(
      "",
    );

    setSelectedExploreCity(
      "",
    );

    setMunicipalityMenuOpen(
      false,
    );

    setExploreEvents(
      [],
    );

    setExploreEventsError(
      null,
    );
  }

  function handleMunicipalityQueryChange(
    value: string,
  ) {
    setHasExploreLocationInteraction(
      true,
    );

    setMunicipalityQuery(
      value,
    );

    /*
     * Mientras se escribe no existe todavía
     * un municipio confirmado.
     */
    setSelectedExploreCity(
      "",
    );

    setSelectedMunicipalityCode(
      "",
    );

    /*
     * Nunca mostramos resultados de la ciudad
     * anterior mientras el usuario está buscando
     * una ubicación nueva.
     */
    setExploreEvents(
      [],
    );

    setExploreEventsError(
      null,
    );

    setMunicipalityMenuOpen(
      true,
    );
  }

  function selectMunicipality(
    municipality:
      SpainMunicipality,
  ) {
    setHasExploreLocationInteraction(
      true,
    );

    setSelectedMunicipalityCode(
      municipality.ineCode,
    );

    setMunicipalityQuery(
      municipality.name,
    );

    setSelectedExploreCity(
      municipality.name,
    );

    setMunicipalityMenuOpen(
      false,
    );

    setExploreEvents(
      [],
    );

    setExploreEventsError(
      null,
    );
  }

  function useProfileCity() {
    if (!profileCity) {
      return;
    }

    setHasExploreLocationInteraction(
      true,
    );

    setSelectedProvinceCode(
      "",
    );

    setSelectedMunicipalityCode(
      "",
    );

    setMunicipalities(
      [],
    );

    setMunicipalityQuery(
      profileCity,
    );

    setSelectedExploreCity(
      profileCity,
    );

    setMunicipalityMenuOpen(
      false,
    );

    setExploreEvents(
      [],
    );

    setExploreEventsError(
      null,
    );
  }

  /*
   * ==========================================================
   * LOAD EXPLORE
   * ==========================================================
   */

  const loadExploreEvents =
    useCallback(
      async (
        signal?:
          AbortSignal,
      ) => {
        const accessToken =
          session
            ?.access_token;

        if (
          !accessToken
        ) {
          setExploreEvents(
            [],
          );

          setExploreEventsError(
            "Tu sesión no es válida.",
          );

          setExploreEventsLoading(
            false,
          );

          return;
        }

        /*
         * No tener ciudad elegida no es un error.
         * Es un estado normal de la interfaz.
         */
        if (
          !selectedExploreCity
        ) {
          setExploreEvents(
            [],
          );

          setExploreEventsError(
            null,
          );

          setExploreEventsLoading(
            false,
          );

          return;
        }

        setExploreEventsLoading(
          true,
        );

        setExploreEventsError(
          null,
        );

        try {
          const result =
            signal
              ? await getExploreEvents({
                accessToken,

                city:
                  selectedExploreCity,

                signal,
              })
              : await getExploreEvents({
                accessToken,

                city:
                  selectedExploreCity,
              });

          if (
            signal?.aborted
          ) {
            return;
          }

          setExploreEvents(
            result,
          );
        } catch (
        error
        ) {
          if (
            signal?.aborted
          ) {
            return;
          }

          if (
            error instanceof
            DOMException &&
            error.name ===
            "AbortError"
          ) {
            return;
          }

          setExploreEvents(
            [],
          );

          setExploreEventsError(
            error instanceof
              Error
              ? error.message
              : "No se pudieron cargar los eventos.",
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setExploreEventsLoading(
              false,
            );
          }
        }
      },
      [
        selectedExploreCity,
        session
          ?.access_token,
      ],
    );

  /*
   * ==========================================================
   * LOAD MY EVENTS
   * ==========================================================
   */

  const loadMyEvents =
    useCallback(
      async () => {
        const accessToken =
          session
            ?.access_token;

        if (
          !accessToken
        ) {
          setMyEvents(
            [],
          );

          setMyEventsError(
            "Tu sesión no es válida.",
          );

          return;
        }

        setMyEventsLoading(
          true,
        );

        setMyEventsError(
          null,
        );

        try {
          const result =
            await getMyEvents(
              accessToken,
            );

          setMyEvents(
            result,
          );
        } catch (
        error
        ) {
          setMyEvents(
            [],
          );

          setMyEventsError(
            error instanceof
              Error
              ? error.message
              : "No se pudieron cargar tus eventos.",
          );
        } finally {
          setMyEventsLoading(
            false,
          );
        }
      },
      [
        session
          ?.access_token,
      ],
    );

  /*
   * ==========================================================
   * URL PERSISTENCE
   * ==========================================================
   */

  useEffect(() => {
    const url =
      new URL(
        window.location.href,
      );

    if (
      activeTab ===
      "explore"
    ) {
      url.searchParams.delete(
        "eventsTab",
      );
    } else {
      url.searchParams.set(
        "eventsTab",
        activeTab,
      );
    }

    if (
      selectedExploreCity
    ) {
      url.searchParams.set(
        "eventsCity",
        selectedExploreCity,
      );
    } else {
      url.searchParams.delete(
        "eventsCity",
      );
    }

    if (
      selectedProvinceCode
    ) {
      url.searchParams.set(
        "eventsProvince",
        selectedProvinceCode,
      );
    } else {
      url.searchParams.delete(
        "eventsProvince",
      );
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [
    activeTab,
    selectedExploreCity,
    selectedProvinceCode,
  ]);

  /*
   * ==========================================================
   * EXPLORE FETCH
   * ==========================================================
   */

  useEffect(() => {
    if (
      activeTab !==
      "explore"
    ) {
      return;
    }

    const controller =
      new AbortController();

    void loadExploreEvents(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [
    activeTab,
    loadExploreEvents,
  ]);

  /*
   * ==========================================================
   * MY EVENTS FETCH
   * ==========================================================
   */

  useEffect(() => {
    if (
      activeTab !==
      "mine"
    ) {
      return;
    }

    void loadMyEvents();
  }, [
    activeTab,
    createdDraft?.id,
    loadMyEvents,
  ]);

  /*
   * Después de crear un borrador mostramos
   * automáticamente Mis eventos.
   */
  useEffect(() => {
    if (
      !createdDraft
    ) {
      return;
    }

    setActiveTab(
      "mine",
    );
  }, [
    createdDraft,
  ]);

  /*
   * ==========================================================
   * MY EVENTS DERIVED STATE
   * ==========================================================
   */

  const statusCounts =
    useMemo(
      () => {
        const counts:
          Record<
            EventLifecycleStatus,
            number
          > = {
          draft: 0,
          upcoming: 0,
          live: 0,
          ended: 0,
          cancelled: 0,
        };

        for (
          const event
          of myEvents
        ) {
          counts[
            event.lifecycleStatus
          ] += 1;
        }

        return counts;
      },
      [
        myEvents,
      ],
    );

  const filteredMyEvents =
    useMemo(
      () => {
        if (
          myEventsFilter ===
          "all"
        ) {
          return myEvents;
        }

        return myEvents.filter(
          (
            event,
          ) =>
            event.lifecycleStatus ===
            myEventsFilter,
        );
      },
      [
        myEvents,
        myEventsFilter,
      ],
    );

  return (
    <section className="space-y-5 pb-24">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#5D5FEF] via-[#6668F4] to-[#7B6CF6] p-6 text-white shadow-lg shadow-[#5D5FEF]/20 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-white">
              <Sparkles
                size={13}
              />

              Descubre
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-[2rem]">
              Eventos en{" "}
              <span className="text-violet-100">
                {
                  displayCity
                }
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-50">
              Explora experiencias publicadas por ciudad, guarda lo que te interese y gestiona tus propios eventos desde un solo lugar.
            </p>
          </div>

          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white sm:flex">
            <CalendarDays
              size={25}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={
            onCreateEvent
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[#5557D8] shadow-sm transition hover:bg-violet-50 sm:w-auto"
        >
          <Plus
            size={18}
          />

          Crear evento
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setActiveTab(
              "explore",
            )
          }
          className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab ===
            "explore"
            ? "bg-[#5D5FEF] text-white shadow-md shadow-[#5D5FEF]/15"
            : "text-slate-500 hover:bg-[#F3F2FF] hover:text-[#5D5FEF]"
            }`}
        >
          Explorar
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              "saved",
            )
          }
          className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab ===
            "saved"
            ? "bg-[#5D5FEF] text-white shadow-md shadow-[#5D5FEF]/15"
            : "text-slate-500 hover:bg-[#F3F2FF] hover:text-[#5D5FEF]"
            }`}
        >
          Guardados
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              "mine",
            )
          }
          className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab ===
            "mine"
            ? "bg-[#5D5FEF] text-white shadow-md shadow-[#5D5FEF]/15"
            : "text-slate-500 hover:bg-[#F3F2FF] hover:text-[#5D5FEF]"
            }`}
        >
          Mis eventos
        </button>
      </div>

      {activeTab ===
        "explore" ? (
        <div className="space-y-4">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
                <MapPin
                  size={20}
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                  Zona de búsqueda
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Elige dónde explorar
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Los eventos no dependen de tu posición física. Puedes explorar cualquier municipio de España.
                </p>
              </div>
            </div>

            {selectedExploreCity ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F8F8FF] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <MapPin
                    size={16}
                    className="text-[#5D5FEF]"
                  />

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Explorando ahora
                    </p>

                    <p className="text-sm font-black text-slate-900">
                      {
                        selectedExploreCity
                      }

                      {selectedProvince
                        ? ` · ${selectedProvince.name}`
                        : ""}
                    </p>
                  </div>
                </div>

                {profileCity &&
                  normalizeLocationSearch(
                    profileCity,
                  ) !==
                  normalizeLocationSearch(
                    selectedExploreCity,
                  ) ? (
                  <button
                    type="button"
                    onClick={
                      useProfileCity
                    }
                    className="rounded-xl border border-[#5D5FEF]/15 bg-white px-3 py-2 text-xs font-black text-[#5557D8] transition hover:bg-[#F0F0FF]"
                  >
                    Volver a{" "}
                    {
                      profileCity
                    }
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="explore-province"
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

                    Cargando provincias…
                  </div>
                ) : (
                  <div className="relative mt-2">
                    <select
                      id="explore-province"
                      value={
                        selectedProvinceCode
                      }
                      onChange={(
                        event,
                      ) =>
                        handleProvinceChange(
                          event.target
                            .value,
                        )
                      }
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
                  htmlFor="explore-city"
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
                    id="explore-city"
                    value={
                      municipalityQuery
                    }
                    onChange={(
                      event,
                    ) =>
                      handleMunicipalityQueryChange(
                        event.target
                          .value,
                      )
                    }
                    onFocus={() => {
                      if (
                        selectedProvinceCode
                      ) {
                        setMunicipalityMenuOpen(
                          true,
                        );
                      }
                    }}
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
                    aria-controls={
                      EXPLORE_MUNICIPALITY_LIST_ID
                    }
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    className="w-full rounded-2xl border border-slate-200 bg-[#FBFCFE] py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:bg-white focus:ring-4 focus:ring-[#5D5FEF]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {municipalityMenuOpen &&
                    selectedProvinceCode &&
                    !municipalitiesLoading ? (
                    <div
                      id={
                        EXPLORE_MUNICIPALITY_LIST_ID
                      }
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
                                selectedMunicipalityCode ===
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
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${selectedMunicipalityCode ===
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

                              {selectedMunicipalityCode ===
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

                    Cargando municipios…
                  </p>
                ) : municipalitiesError ? (
                  <p className="mt-2 text-xs font-bold text-rose-600">
                    {
                      municipalitiesError
                    }
                  </p>
                ) : selectedMunicipalityCode ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <Check
                      size={13}
                    />

                    Municipio oficial seleccionado
                  </p>
                ) : null}
              </div>
            </div>

            {profileCity &&
              !selectedProvinceCode ? (
              <p className="mt-4 text-xs font-medium leading-5 text-slate-400">
                LookUp puede usar tu ciudad de perfil directamente. Selecciona provincia y municipio solo cuando quieras explorar otra zona.
              </p>
            ) : null}
          </section>

          <div className="flex items-center justify-between gap-4 px-1">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                Explorar
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {!selectedExploreCity
                  ? "Selecciona una ciudad"
                  : exploreEventsLoading
                    ? "Buscando eventos…"
                    : `${exploreEvents.length} evento${exploreEvents.length ===
                      1
                      ? ""
                      : "s"
                    } disponible${exploreEvents.length ===
                      1
                      ? ""
                      : "s"
                    }`}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadExploreEvents()
              }
              disabled={
                exploreEventsLoading ||
                !selectedExploreCity
              }
              aria-label="Actualizar eventos"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#5D5FEF] shadow-sm transition hover:border-[#5D5FEF]/30 hover:bg-[#F3F2FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  exploreEventsLoading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>

          {!selectedExploreCity ? (
            <div className="rounded-[2rem] border border-[#5D5FEF]/15 bg-[#F8F8FF] p-8 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-[#5D5FEF] shadow-sm">
                <MapPin
                  size={29}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                Elige una ciudad para empezar
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Explorar funciona por territorio, no por los 25 metros del Radar. Puedes descubrir eventos de cualquier municipio.
              </p>

              {profileCity ? (
                <button
                  type="button"
                  onClick={
                    useProfileCity
                  }
                  className="mt-6 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF]"
                >
                  Explorar{" "}
                  {
                    profileCity
                  }
                </button>
              ) : null}
            </div>
          ) : null}

          {selectedExploreCity &&
            exploreEventsLoading &&
            exploreEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm">
              <RefreshCw
                size={25}
                className="mx-auto animate-spin text-[#5D5FEF]"
              />

              <p className="mt-4 text-sm font-black text-slate-700">
                Buscando eventos en{" "}
                {
                  displayCity
                }…
              </p>
            </div>
          ) : null}

          {selectedExploreCity &&
            exploreEventsError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
              <p className="text-sm font-black text-rose-800">
                No pudimos cargar Explorar
              </p>

              <p className="mt-2 text-sm leading-6 text-rose-700">
                {
                  exploreEventsError
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadExploreEvents()
                }
                disabled={
                  exploreEventsLoading
                }
                className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {selectedExploreCity &&
            !exploreEventsLoading &&
            !exploreEventsError &&
            exploreEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
                <CalendarDays
                  size={30}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                Todavía no hay eventos publicados en{" "}
                {
                  displayCity
                }
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Aquí aparecerán los eventos publicados que estén en curso o todavía vayan a comenzar.
              </p>

              <button
                type="button"
                onClick={
                  onCreateEvent
                }
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF]"
              >
                <Plus
                  size={17}
                />

                Crear evento
              </button>
            </div>
          ) : null}

          {exploreEvents.map(
            (
              event,
            ) => (
              <article
                key={
                  event.id
                }
                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition hover:border-[#5D5FEF]/20 hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getExploreStatusClasses(
                        event,
                      )}`}
                    >
                      {event.lifecycleStatus ===
                        "live" ? (
                        <CircleDot
                          size={12}
                        />
                      ) : (
                        <CalendarDays
                          size={12}
                        />
                      )}

                      {getExploreStatusLabel(
                        event,
                      )}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                      {
                        event.category
                      }
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                    {
                      event.title
                    }
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                    {
                      event.description
                    }
                  </p>

                  {event.tags.length >
                    0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.tags
                        .slice(
                          0,
                          5,
                        )
                        .map(
                          (
                            tag,
                          ) => (
                            <span
                              key={
                                tag
                              }
                              className="rounded-full bg-[#F0F0FF] px-3 py-1.5 text-xs font-black text-[#5052D9]"
                            >
                              {
                                tag
                              }
                            </span>
                          ),
                        )}
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F8FF] px-4 py-3.5">
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5D5FEF]"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">
                          {
                            event.venueName
                          }
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {
                            event.city
                          }

                          {event.province
                            ? ` · ${event.province}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl bg-[#F8F8FF] px-4 py-3.5">
                      <CalendarDays
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5D5FEF]"
                      />

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {formatEventDate(
                            event.startAt,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          {formatExplorePrice(
                            event,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {event.capacity ? (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Users
                        size={15}
                        className="text-[#5D5FEF]"
                      />

                      Aforo máximo:{" "}
                      {
                        event.capacity
                      }
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      onJoinEvent(
                        event.id,
                      )
                    }
                    className="mt-5 w-full rounded-2xl bg-[#5D5FEF] py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition hover:bg-[#5254DF]"
                  >
                    Ver evento
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}

      {activeTab ===
        "saved" ? (
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
            <Bookmark
              size={29}
            />
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            Tus eventos guardados vivirán aquí
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            En el siguiente bloque conectaremos favoritos persistentes para guardar eventos de otras personas y negocios.
          </p>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "explore",
              )
            }
            className="mt-6 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF]"
          >
            Explorar eventos
          </button>
        </div>
      ) : null}

      {activeTab ===
        "mine" ? (
        <div className="space-y-4">
          {createdDraft ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-black text-emerald-900">
                  Borrador guardado
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-emerald-700">
                  “{createdDraft.title}” ya forma parte de tus eventos.
                </p>
              </div>
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                  Gestión
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Mis eventos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    myEvents.length
                  }{" "}
                  evento
                  {
                    myEvents.length ===
                      1
                      ? ""
                      : "s"
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadMyEvents()
                }
                disabled={
                  myEventsLoading
                }
                aria-label="Actualizar mis eventos"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-[#5D5FEF] transition hover:border-[#5D5FEF]/30 hover:bg-[#F3F2FF] disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    myEventsLoading
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>

            {myEvents.length >
              0 ? (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() =>
                    setMyEventsFilter(
                      "all",
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${myEventsFilter ===
                    "all"
                    ? "bg-[#5D5FEF] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-[#F0F0FF] hover:text-[#5D5FEF]"
                    }`}
                >
                  Todos ·{" "}
                  {
                    myEvents.length
                  }
                </button>

                {STATUS_ORDER.map(
                  (
                    status,
                  ) => (
                    <button
                      key={
                        status
                      }
                      type="button"
                      onClick={() =>
                        setMyEventsFilter(
                          status,
                        )
                      }
                      className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${myEventsFilter ===
                        status
                        ? "bg-[#5D5FEF] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-[#F0F0FF] hover:text-[#5D5FEF]"
                        }`}
                    >
                      {
                        STATUS_LABELS[
                        status
                        ]
                      }{" "}
                      ·{" "}
                      {
                        statusCounts[
                        status
                        ]
                      }
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>

          {myEventsLoading &&
            myEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm">
              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-[#5D5FEF]"
              />

              <p className="mt-4 text-sm font-bold text-slate-600">
                Cargando tus eventos…
              </p>
            </div>
          ) : null}

          {myEventsError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
              <p className="text-sm font-black text-rose-800">
                No pudimos cargar tus eventos
              </p>

              <p className="mt-2 text-sm leading-6 text-rose-700">
                {
                  myEventsError
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadMyEvents()
                }
                className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!myEventsLoading &&
            !myEventsError &&
            myEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#F0F0FF] text-[#5D5FEF]">
                <CalendarDays
                  size={29}
                />
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                Todavía no has creado ningún evento
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Cuando crees uno, podrás gestionarlo desde aquí durante todo su ciclo de vida.
              </p>

              <button
                type="button"
                onClick={
                  onCreateEvent
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white"
              >
                <Plus
                  size={17}
                />

                Crear evento
              </button>
            </div>
          ) : null}

          {!myEventsLoading &&
            !myEventsError &&
            myEvents.length >
            0 &&
            filteredMyEvents.length ===
            0 ? (
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-7 text-center shadow-sm">
              <p className="text-sm font-black text-slate-800">
                No tienes eventos en este estado.
              </p>
            </div>
          ) : null}

          {filteredMyEvents.map(
            (
              event,
            ) => (
              <article
                key={
                  event.id
                }
                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getStatusClasses(
                            event.lifecycleStatus,
                          )}`}
                        >
                          {getStatusIcon(
                            event.lifecycleStatus,
                          )}

                          {
                            STATUS_LABELS[
                            event
                              .lifecycleStatus
                            ]
                          }
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                          {
                            event.category
                          }
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                        {
                          event.title
                        }
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                    {
                      event.description
                    }
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5D5FEF]"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">
                          {
                            event.venueName
                          }
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {
                            event.city
                          }

                          {event.province
                            ? ` · ${event.province}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
                      <CalendarDays
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5D5FEF]"
                      />

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {formatEventDate(
                            event.startAt,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {event.isFree
                            ? "Gratis"
                            : event.priceFrom !==
                              null
                              ? `Desde ${event.priceFrom} ${event.currency}`
                              : "De pago"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {event.lifecycleStatus ===
                    "draft" ? (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F0F0FF] px-4 py-3.5">
                      <Sparkles
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5D5FEF]"
                      />

                      <div>
                        <p className="text-sm font-black text-[#494BC8]">
                          Listo para LookUp Intelligence
                        </p>

                        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                          Analiza la preparación del evento antes de publicarlo.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#5D5FEF] px-4 py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition hover:bg-[#5254DF]"
                  >
                    Gestionar evento
                  </Link>
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}