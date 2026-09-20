"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

import {
  EventCoverImage,
} from "@/components/events/EventCoverImage";

import {
  useAuth,
} from "@/components/auth-provider";

import { exploreFilters, getExploreCategory, type ExploreFilter } from "@/lib/events/event-explore-categories";
import { EventExploreMap } from "@/components/events/EventExploreMap";
import { geocodeAddress, type GeocodedAddress } from "@/services/location/geocode-address";

import {
  SavedEventsPanel,
} from "@/components/events/SavedEventsPanel";

import type {
  CreatedEventDraft,
} from "@/lib/events/event-domain";

import {
  getExploreEvents,
  type ExploreEvent,
} from "@/services/events/get-explore-events";

import {
  getMyEvents,
  type EventLifecycleStatus,
  type MyEvent,
} from "@/services/events/get-my-events";

type ExploreCity = { id: string; name: string; province: string; provinceCode: string };

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
   * con DashboardPage.
   *
   * Explorar utiliza el feed real.
   */
  events: EventCard[];

  city?: string | null;

  createdDraft?: CreatedEventDraft | null;
  createdPublished?: boolean;

  onCreateEvent: () => void;

  onJoinEvent: (
    id: string,
  ) => void;
};

type EventsTab =
  | "explore"
  | "saved"
  | "mine";

type MyEventsSection =
  | "active"
  | "drafts"
  | "ended"
  | "cancelled";

const MY_EVENTS_SECTIONS: readonly MyEventsSection[] =
  [
    "active",
    "drafts",
    "ended",
    "cancelled",
  ];

const STATUS_LABELS: Record<
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

const MY_EVENTS_SECTION_LABELS: Record<
  MyEventsSection,
  string
> = {
  active:
    "Activos",

  drafts:
    "Borradores",

  ended:
    "Finalizados",

  cancelled:
    "Cancelados",
};

const MY_EVENTS_SECTION_DESCRIPTIONS: Record<
  MyEventsSection,
  string
> = {
  active:
    "Eventos publicados que están en curso o todavía van a comenzar.",

  drafts:
    "Eventos que todavía puedes preparar, analizar y publicar.",

  ended:
    "Historial de eventos que ya finalizaron.",

  cancelled:
    "Eventos cancelados que conservamos como historial.",
};

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
    tab ===
    "saved" ||
    tab ===
    "mine"
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

function getInitialMyEventsSection(): MyEventsSection {
  if (
    typeof window ===
    "undefined"
  ) {
    return "active";
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  const section =
    params.get(
      "eventsMine",
    );

  if (
    section ===
    "drafts" ||
    section ===
    "ended" ||
    section ===
    "cancelled"
  ) {
    return section;
  }

  return "active";
}

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
      return "bg-[#F0F0FF] text-[#5557D8]";

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

function getMyEventsSectionIcon(
  section:
    MyEventsSection,
) {
  switch (
  section
  ) {
    case "active":
      return (
        <CircleDot
          size={19}
        />
      );

    case "drafts":
      return (
        <Clock3
          size={19}
        />
      );

    case "ended":
      return (
        <Check
          size={19}
        />
      );

    case "cancelled":
      return (
        <Clock3
          size={19}
        />
      );
  }
}

function getEmptySectionCopy(
  section:
    MyEventsSection,
) {
  switch (
  section
  ) {
    case "active":
      return {
        title:
          "No tienes eventos activos",

        description:
          "Cuando publiques un evento aparecerá aquí mientras esté próximo o en curso.",
      };

    case "drafts":
      return {
        title:
          "No tienes borradores",

        description:
          "Los eventos que guardes antes de publicar aparecerán aquí para que puedas seguir preparándolos.",
      };

    case "ended":
      return {
        title:
          "Todavía no hay eventos finalizados",

        description:
          "Cuando termine uno de tus eventos, quedará organizado aquí como parte de tu historial.",
      };

    case "cancelled":
      return {
        title:
          "No tienes eventos cancelados",

        description:
          "Si cancelas un evento, quedará aquí separado del resto para mantener tu gestión limpia.",
      };
  }
}

export function EventsView({
  city,
  createdDraft = null,
  createdPublished = false,
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

  const [selectedExploreCity, setSelectedExploreCity] = useState("");
  const [cityQuery, setCityQuery] = useState(() => getInitialExploreCity(profileCity));
  const [cityLocation, setCityLocation] = useState<GeocodedAddress | null>(null);
  const [cityChoices, setCityChoices] = useState<ExploreCity[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("all");
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [exploreEvents, setExploreEvents] = useState<ExploreEvent[]>([]);
  const [exploreEventsLoading, setExploreEventsLoading] = useState(false);
  const [exploreEventsError, setExploreEventsError] = useState<string | null>(null);
  const cityRequest = useRef<AbortController | null>(null);

  useEffect(() => () => cityRequest.current?.abort(), []);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("lookup.events.exploreCity") ?? "null") as {
        city: string; province: string; location: GeocodedAddress;
      } | null;
      const requested = new URLSearchParams(window.location.search).get("eventsCity");
      if (!saved || (requested && requested !== saved.city) || typeof saved.city !== "string" ||
        typeof saved.province !== "string" || !Number.isFinite(saved.location?.latitude) ||
        !Number.isFinite(saved.location?.longitude) || Math.abs(saved.location.latitude) > 90 || Math.abs(saved.location.longitude) > 180) return;
      setSelectedExploreCity(saved.city);
      setSelectedProvince(saved.province);
      setCityLocation(saved.location);
      setCityQuery(saved.city);
    } catch {
      // Storage is optional; a city can always be selected again.
    }
  }, []);

  const filteredExploreEvents = useMemo(() => exploreEvents.filter((event) => activeFilter === "all" || getExploreCategory(event.category).group === activeFilter), [exploreEvents, activeFilter]);

  async function searchCity() {
    const query = cityQuery.trim();
    if (query.length < 2) return;
    cityRequest.current?.abort();
    const controller = new AbortController();
    cityRequest.current = controller;
    setCityLoading(true);
    setCityError(null);
    setCityChoices([]);
    try {
      const response = await fetch(`/api/events/cities?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (!response.ok) throw new Error("No se pudieron buscar los municipios.");
      const payload = await response.json() as { cities: ExploreCity[] };
      if (controller.signal.aborted) return;
      setCityChoices(payload.cities);
      if (!payload.cities.length) setCityError("No encontramos ese municipio. Prueba su nombre o añade la provincia.");
    } catch (error) {
      if (!controller.signal.aborted) {
        setCityError(error instanceof Error ? error.message : "No se pudo localizar la ciudad.");
      }
    } finally {
      if (!controller.signal.aborted) setCityLoading(false);
    }
  }

  async function selectExploreCity(city: ExploreCity) {
    cityRequest.current?.abort();
    const controller = new AbortController();
    cityRequest.current = controller;
    setCityLoading(true);
    setCityError(null);
    setExploreEvents([]);
    setSelectedExploreCity("");
    setCityLocation(null);
    try {
      const location = await geocodeAddress(city.name, { cityOnly: true, province: city.province, signal: controller.signal });
      if (controller.signal.aborted) return;
      setCityLocation(location);
      setSelectedExploreCity(city.name);
      setSelectedProvince(city.province);
      try {
        sessionStorage.setItem("lookup.events.exploreCity", JSON.stringify({ city: city.name, province: city.province, location }));
      } catch { /* Private browsing may disable storage. */ }
      setCityQuery(city.name);
      setCityChoices([]);
      setActiveFilter("all");
    } catch (error) {
      if (!controller.signal.aborted) setCityError(error instanceof Error ? error.message : "No se pudo localizar el municipio.");
    } finally {
      if (!controller.signal.aborted) setCityLoading(false);
    }
  }

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
    useState(
      false,
    );

  const [
    myEventsError,
    setMyEventsError,
  ] =
    useState<
      string | null
    >(null);

  const [
    myEventsSection,
    setMyEventsSection,
  ] =
    useState<MyEventsSection>(
      getInitialMyEventsSection,
    );

  const displayCity =
    selectedExploreCity ||
    "la ciudad que elijas";

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

        setExploreEvents([]);
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
                mapView: true,
                province: selectedProvince,

                city:
                  selectedExploreCity,

                signal,
              })
              : await getExploreEvents({
                accessToken,
                mapView: true,
                province: selectedProvince,

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
        selectedProvince,
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

    url.searchParams.delete("eventsProvince");

    if (
      myEventsSection ===
      "active"
    ) {
      url.searchParams.delete(
        "eventsMine",
      );
    } else {
      url.searchParams.set(
        "eventsMine",
        myEventsSection,
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
    myEventsSection,
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
   * Después de crear un borrador abrimos directamente
   * Mis eventos > Borradores.
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

    setMyEventsSection(
      createdPublished ? "active" : "drafts",
    );
  }, [
    createdPublished,
    createdDraft,
  ]);

  /*
   * ==========================================================
   * MY EVENTS DERIVED STATE
   * ==========================================================
   */

  const myEventsSectionCounts =
    useMemo<
      Record<
        MyEventsSection,
        number
      >
    >(
      () => {
        const counts: Record<
          MyEventsSection,
          number
        > = {
          active:
            0,

          drafts:
            0,

          ended:
            0,

          cancelled:
            0,
        };

        for (
          const event
          of myEvents
        ) {
          switch (
          event.lifecycleStatus
          ) {
            case "upcoming":
            case "live":
              counts.active +=
                1;
              break;

            case "draft":
              counts.drafts +=
                1;
              break;

            case "ended":
              counts.ended +=
                1;
              break;

            case "cancelled":
              counts.cancelled +=
                1;
              break;
          }
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
        switch (
        myEventsSection
        ) {
          case "active":
            return myEvents.filter(
              (
                event,
              ) =>
                event.lifecycleStatus ===
                "upcoming" ||
                event.lifecycleStatus ===
                "live",
            );

          case "drafts":
            return myEvents.filter(
              (
                event,
              ) =>
                event.lifecycleStatus ===
                "draft",
            );

          case "ended":
            return myEvents.filter(
              (
                event,
              ) =>
                event.lifecycleStatus ===
                "ended",
            );

          case "cancelled":
            return myEvents.filter(
              (
                event,
              ) =>
                event.lifecycleStatus ===
                "cancelled",
            );
        }
      },
      [
        myEvents,
        myEventsSection,
      ],
    );

  const emptySectionCopy =
    getEmptySectionCopy(
      myEventsSection,
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
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[#5557D8] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-md sm:w-auto"
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

      {activeTab === "explore" ? (
        <div className="space-y-5">
          <section className="rounded-[1.75rem] border border-[#5D5FEF]/10 bg-white p-4 shadow-sm sm:p-6">
            <form onSubmit={(event) => { event.preventDefault(); void searchCity(); }}>
              <label htmlFor="explore-city" className="text-sm font-black text-slate-900">¿Dónde quieres explorar?</label>
              <p id="explore-city-help" className="mt-1 text-xs leading-5 text-slate-500">Busca un municipio. Te mostraremos su provincia para que elijas el lugar correcto.</p>
              <div className="mt-3 flex gap-2">
                <input id="explore-city" aria-describedby="explore-city-help" value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="Soria, Zaragoza…" required minLength={2} maxLength={120} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-[#F8F8FF] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#5D5FEF] focus:ring-4 focus:ring-[#5D5FEF]/10" />
                <button type="submit" disabled={cityLoading || cityQuery.trim().length < 2} className="min-h-12 rounded-2xl bg-[#5D5FEF] px-4 text-sm font-bold text-white transition hover:bg-[#5254DF] disabled:opacity-50">{cityLoading ? "Buscando…" : "Buscar"}</button>
              </div>
            </form>
            {cityError ? <p role="alert" className="mt-3 text-sm text-rose-700">{cityError}</p> : null}
            {cityChoices.length > 0 ? (
              <div className="mt-4" aria-label="Municipios encontrados">
                <p className="mb-2 text-xs font-semibold text-slate-500">Elige el municipio</p>
                <ul className="max-h-60 space-y-1 overflow-y-auto">
                  {cityChoices.map((city) => <li key={city.id}><button type="button" disabled={cityLoading} onClick={() => void selectExploreCity(city)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[#F0F0FF] focus-visible:outline-[#5D5FEF] disabled:opacity-50"><MapPin size={18} className="shrink-0 text-[#5D5FEF]" /><span><span className="block text-sm font-bold text-slate-900">{city.name}</span><span className="text-xs text-slate-500">Municipio · Provincia de {city.province}</span></span><ChevronRight size={16} className="ml-auto shrink-0 text-slate-400" /></button></li>)}
                </ul>
              </div>
            ) : null}
          </section>
          {cityLocation ? (
            <>
              <section aria-label="Filtrar eventos" className="rounded-2xl bg-[#F0F0FF]/70 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-[#5557D8]">¿Qué buscas?</p>
                <div className="flex flex-wrap gap-2">
                  {exploreFilters.map((filter) => <button key={filter.id} type="button" aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)} className={`min-h-11 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-[#5D5FEF] ${activeFilter === filter.id ? "bg-[#5D5FEF] text-white shadow-sm" : "bg-white text-slate-600 hover:bg-white/70"}`}>{filter.label}</button>)}
                </div>
              </section>
              <EventExploreMap latitude={cityLocation.latitude} longitude={cityLocation.longitude} city={selectedExploreCity} events={filteredExploreEvents} />
              <section aria-label="Eventos encontrados" className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="text-lg font-black text-slate-900">En {selectedExploreCity}</h2><p className="text-xs text-slate-500">Provincia de {selectedProvince}</p></div><p aria-live="polite" className="text-xs font-semibold text-[#5557D8]">{exploreEventsLoading ? "Cargando…" : `${filteredExploreEvents.length} evento${filteredExploreEvents.length === 1 ? "" : "s"}`}</p></div>
                {exploreEventsError ? <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{exploreEventsError}</p> : null}
                {!exploreEventsLoading && !exploreEventsError && filteredExploreEvents.length === 0 ? <div className="rounded-2xl border border-dashed border-[#5D5FEF]/20 bg-white p-6 text-center"><p className="text-sm font-bold text-slate-700">{activeFilter === "all" ? "Todavía no hay eventos en esta ciudad" : "No hay eventos de este tipo"}</p><p className="mt-1 text-xs text-slate-500">{activeFilter === "all" ? "Prueba otro municipio o vuelve más adelante." : "Prueba con Todo para ver el resto de propuestas."}</p></div> : null}
                <ul className="space-y-3">
                  {filteredExploreEvents.map((event) => (
                    <li key={event.id}>
                      <Link href={`/events/${encodeURIComponent(event.id)}`} className="group flex items-center gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#5D5FEF]/30 hover:shadow-md focus-visible:outline-[#5D5FEF] sm:gap-4 sm:p-5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]"><CalendarDays size={22} /></span>
                        <div className="min-w-0 flex-1"><span className="inline-block rounded-lg bg-[#F0F0FF] px-2 py-1 text-[10px] font-bold text-[#5557D8]">{getExploreCategory(event.category).label}</span><h3 className="mt-2 break-words text-base font-black leading-snug text-slate-900">{event.title}</h3><p className="mt-1 break-words text-xs leading-5 text-slate-500">{event.venueName || event.address} · {event.city}</p></div>
                        <ChevronRight size={18} className="shrink-0 text-[#5D5FEF] transition group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : !cityLoading && cityChoices.length === 0 ? <p className="px-2 text-center text-sm text-slate-500">Elige un municipio y descubre qué pasa cerca.</p> : null}
        </div>
      ) : null}

      {activeTab ===
        "saved" ? (
        <SavedEventsPanel
          onOpen={
            onJoinEvent
          }
        />
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
                  {createdPublished ? "Evento publicado" : "Borrador guardado"}
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-emerald-700">
                  “{createdDraft.title}” {createdPublished ? "ya está disponible en tus eventos activos." : "ya está organizado dentro de tus borradores."}
                </p>
              </div>
            </div>
          ) : null}

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                  Gestión
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Mis eventos
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Mantén cada etapa separada para encontrar rápidamente lo que estás gestionando.
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#5D5FEF] shadow-sm transition hover:border-[#5D5FEF]/30 hover:bg-[#F3F2FF] disabled:opacity-50"
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
              <div className="mt-6 grid grid-cols-2 gap-3">
                {MY_EVENTS_SECTIONS.map(
                  (
                    section,
                  ) => {
                    const selected =
                      myEventsSection ===
                      section;

                    return (
                      <button
                        key={
                          section
                        }
                        type="button"
                        onClick={() =>
                          setMyEventsSection(
                            section,
                          )
                        }
                        className={`group relative overflow-hidden rounded-[1.35rem] border p-4 text-left transition-all ${selected
                          ? "border-[#5D5FEF] bg-gradient-to-br from-[#5D5FEF] to-[#7066F4] text-white shadow-lg shadow-[#5D5FEF]/15"
                          : "border-slate-200 bg-[#FBFCFE] text-slate-700 hover:-translate-y-0.5 hover:border-[#5D5FEF]/20 hover:bg-[#F8F8FF]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${selected
                              ? "bg-white/15 text-white"
                              : "bg-[#F0F0FF] text-[#5D5FEF]"
                              }`}
                          >
                            {getMyEventsSectionIcon(
                              section,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black ${selected
                              ? "bg-white/15 text-white"
                              : "bg-white text-slate-600 shadow-sm"
                              }`}
                          >
                            {
                              myEventsSectionCounts[
                              section
                              ]
                            }
                          </span>
                        </div>

                        <p className="mt-4 text-sm font-black">
                          {
                            MY_EVENTS_SECTION_LABELS[
                            section
                            ]
                          }
                        </p>

                        <p
                          className={`mt-1 line-clamp-2 text-[11px] font-medium leading-4 ${selected
                            ? "text-indigo-100"
                            : "text-slate-400"
                            }`}
                        >
                          {
                            MY_EVENTS_SECTION_DESCRIPTIONS[
                            section
                            ]
                          }
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
            ) : null}
          </section>

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
                disabled={
                  myEventsLoading
                }
                className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
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
                Cuando crees uno, LookUp lo organizará según su etapa para que puedas gestionarlo durante todo su ciclo de vida.
              </p>

              <button
                type="button"
                onClick={
                  onCreateEvent
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#5D5FEF] px-5 py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/20 transition hover:bg-[#5254DF]"
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
            0 ? (
            <>
              <div className="flex items-end justify-between gap-4 px-1">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5D5FEF]">
                    {
                      MY_EVENTS_SECTION_LABELS[
                      myEventsSection
                      ]
                    }
                  </p>

                  <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">
                    {
                      MY_EVENTS_SECTION_DESCRIPTIONS[
                      myEventsSection
                      ]
                    }
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#F0F0FF] px-3 py-1.5 text-xs font-black text-[#5557D8]">
                  {
                    filteredMyEvents.length
                  }
                </span>
              </div>

              {filteredMyEvents.length ===
                0 ? (
                <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F0FF] text-[#5D5FEF]">
                    {getMyEventsSectionIcon(
                      myEventsSection,
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                    {
                      emptySectionCopy.title
                    }
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {
                      emptySectionCopy.description
                    }
                  </p>

                  {myEventsSection ===
                    "active" ||
                    myEventsSection ===
                    "drafts" ? (
                    <button
                      type="button"
                      onClick={
                        onCreateEvent
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5D5FEF] px-4 py-3 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition hover:bg-[#5254DF]"
                    >
                      <Plus
                        size={16}
                      />

                      Crear evento
                    </button>
                  ) : null}
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
                    className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition-all hover:border-[#5D5FEF]/15 hover:shadow-md"
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
                                event.lifecycleStatus
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

                      {event.lifecycleStatus ===
                        "ended" ? (
                        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F8F8FF] px-4 py-3.5">
                          <Sparkles
                            size={17}
                            className="mt-0.5 shrink-0 text-[#5D5FEF]"
                          />

                          <div>
                            <p className="text-sm font-black text-[#494BC8]">
                              Historial listo para aprender
                            </p>

                            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                              Cuando existan suficientes señales, LookUp podrá ayudarte a entender qué funcionó y qué conviene mejorar en tus próximos eventos.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5D5FEF] px-4 py-3.5 text-sm font-black text-white shadow-md shadow-[#5D5FEF]/15 transition-all hover:-translate-y-0.5 hover:bg-[#5254DF] hover:shadow-lg"
                      >
                        Gestionar evento

                        <ChevronRight
                          size={16}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                    </div>
                  </article>
                ),
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
