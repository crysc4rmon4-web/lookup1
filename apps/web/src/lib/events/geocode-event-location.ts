import "server-only";

type EventLocationInput = {
  venueName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;
};

export type VerifiedEventLocation = {
  address: string;

  city: string;
  cityKey: string;

  province: string;

  postalCode: string | null;

  countryCode: "ES";

  latitude: number;
  longitude: number;

  displayName: string;

  attribution: string;
};

/*
 * Alias conservado para no romper ningún consumidor
 * que estuviera utilizando el nombre más reciente.
 */
export type GeocodedEventLocation =
  VerifiedEventLocation;

type NominatimGeocodingProperties = {
  label?: string;
  name?: string;

  housenumber?: string;
  street?: string;

  locality?: string;
  district?: string;
  city?: string;

  county?: string;
  state?: string;

  postcode?: string;

  country?: string;
  country_code?: string;
};

type NominatimFeature = {
  type?: string;

  geometry?: {
    type?: string;
    coordinates?: unknown;
  };

  properties?: {
    geocoding?:
      NominatimGeocodingProperties;
  };
};

type NominatimResponse = {
  type?: string;

  geocoding?: {
    attribution?: string;
  };

  features?: NominatimFeature[];
};

type ParsedCoordinates = {
  latitude: number;
  longitude: number;
};

type VerifiedFeature = {
  feature: NominatimFeature;

  coordinates:
    ParsedCoordinates;

  resolvedCity:
    string;

  usedPostalConstraint:
    boolean;
};

type SearchResult = {
  features:
    NominatimFeature[];

  attribution:
    string;
};

const DEFAULT_NOMINATIM_URL =
  "https://nominatim.openstreetmap.org";

const DEFAULT_USER_AGENT =
  "LookUp/1.0";

const DEFAULT_ATTRIBUTION =
  "Data © OpenStreetMap contributors, ODbL 1.0";

const MAX_RESULTS =
  8;

function clean(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .replace(
        /\s+/g,
        " ",
      ) ||
    ""
  );
}

function normalizeComparable(
  value:
    | string
    | null
    | undefined,
) {
  return clean(
    value,
  )
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function normalizePostalCode(
  value:
    | string
    | null
    | undefined,
) {
  return clean(
    value,
  )
    .toUpperCase()
    .replace(
      /[\s-]+/g,
      "",
    );
}

function normalizeCityKey(
  value: string,
) {
  return normalizeComparable(
    value,
  );
}

function getBaseUrl() {
  return (
    process.env
      .LOOKUP_GEOCODER_BASE_URL
      ?.trim()
      .replace(
        /\/+$/,
        "",
      ) ||
    DEFAULT_NOMINATIM_URL
  );
}

function getUserAgent() {
  return (
    process.env
      .LOOKUP_GEOCODER_USER_AGENT
      ?.trim() ||
    DEFAULT_USER_AGENT
  );
}

function looksLikeHouseNumber(
  value: string,
) {
  return /^\d+[a-z]?([/-]\d+[a-z]?)?(\s*(bis|ter))?$/i.test(
    clean(
      value,
    ),
  );
}

/*
 * Convierte tanto una dirección introducida por el usuario:
 *
 *   Calle El Collado 5
 *
 * como una dirección previamente normalizada por OSM:
 *
 *   Calle El Collado, Soria, Castilla y León, 42002, España
 *
 * en un valor adecuado para el parámetro `street`.
 *
 * Este detalle es importante al editar eventos existentes:
 * nunca debemos mandar comunidad autónoma, municipio, país,
 * etc. como parte del nombre de la calle.
 */
function buildStreetSearchValue(
  input: EventLocationInput,
) {
  const address =
    clean(
      input.address,
    );

  if (!address) {
    return "";
  }

  const parts =
    address
      .split(",")
      .map(
        clean,
      )
      .filter(
        Boolean,
      );

  if (
    parts.length ===
    0
  ) {
    return address;
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0] ?? "";
  }

  /*
   * Si la segunda parte es claramente el número,
   * conservamos calle + número.
   *
   * Ej:
   *   Calle Alcalá, 42, Madrid...
   */
  const firstPart =
    parts[0] ?? "";

  const secondPart =
    parts[1] ?? "";

  if (
    secondPart &&
    looksLikeHouseNumber(
      secondPart,
    )
  ) {
    return `${firstPart}, ${secondPart}`;
  }

  /*
   * Si la dirección ya fue guardada por OSM,
   * normalmente la primera parte representa el
   * elemento de calle/plaza/etc. relevante.
   *
   * Esto evita volver a incluir:
   *
   * municipio
   * provincia
   * comunidad autónoma
   * CP
   * España
   *
   * dentro de `street`.
   */
  return firstPart;
}

function parseCoordinates(
  feature:
    NominatimFeature,
): ParsedCoordinates | null {
  const coordinates =
    feature.geometry
      ?.coordinates;

  if (
    !Array.isArray(
      coordinates,
    ) ||
    coordinates.length <
      2
  ) {
    return null;
  }

  const longitude =
    Number(
      coordinates[0],
    );

  const latitude =
    Number(
      coordinates[1],
    );

  if (
    !Number.isFinite(
      latitude,
    ) ||
    !Number.isFinite(
      longitude,
    ) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function getCandidateCities(
  feature:
    NominatimFeature,
) {
  const geocoding =
    feature.properties
      ?.geocoding;

  return [
    clean(
      geocoding?.city,
    ),

    clean(
      geocoding?.locality,
    ),

    clean(
      geocoding?.district,
    ),
  ].filter(
    Boolean,
  );
}

function findDirectCityMatch(
  feature:
    NominatimFeature,
  expectedCity:
    string,
) {
  const normalizedExpected =
    normalizeComparable(
      expectedCity,
    );

  if (
    !normalizedExpected
  ) {
    return null;
  }

  for (
    const candidate of
    getCandidateCities(
      feature,
    )
  ) {
    if (
      normalizeComparable(
        candidate,
      ) ===
      normalizedExpected
    ) {
      return candidate;
    }
  }

  return null;
}

function getFeaturePostalCode(
  feature:
    NominatimFeature,
) {
  return normalizePostalCode(
    feature.properties
      ?.geocoding
      ?.postcode,
  );
}

function hasExactPostalMatch(
  feature:
    NominatimFeature,
  expectedPostalCode:
    | string
    | null,
) {
  const expected =
    normalizePostalCode(
      expectedPostalCode,
    );

  const actual =
    getFeaturePostalCode(
      feature,
    );

  return Boolean(
    expected &&
      actual &&
      expected ===
        actual,
  );
}

function postalCodeIsCompatible(
  feature:
    NominatimFeature,
  expectedPostalCode:
    | string
    | null,
) {
  const expected =
    normalizePostalCode(
      expectedPostalCode,
    );

  if (
    !expected
  ) {
    return true;
  }

  const actual =
    getFeaturePostalCode(
      feature,
    );

  /*
   * Algunas respuestas válidas de Nominatim
   * no incluyen postcode.
   *
   * Si no existe CP en el resultado, no anulamos
   * una coincidencia fuerte de municipio.
   */
  if (
    !actual
  ) {
    return true;
  }

  return (
    actual ===
    expected
  );
}

function labelContainsExactComponent(
  feature:
    NominatimFeature,
  expectedValue:
    string,
) {
  const label =
    clean(
      feature.properties
        ?.geocoding
        ?.label,
    );

  const expected =
    normalizeComparable(
      expectedValue,
    );

  if (
    !label ||
    !expected
  ) {
    return false;
  }

  return label
    .split(",")
    .map(
      normalizeComparable,
    )
    .some(
      (
        component,
      ) =>
        component ===
        expected,
    );
}

function provinceAppearsCompatible(
  feature:
    NominatimFeature,
  expectedProvince:
    string,
) {
  const expected =
    normalizeComparable(
      expectedProvince,
    );

  if (
    !expected
  ) {
    return false;
  }

  const geocoding =
    feature.properties
      ?.geocoding;

  const candidates =
    [
      geocoding?.county,
      geocoding?.state,
    ]
      .map(
        normalizeComparable,
      )
      .filter(
        Boolean,
      );

  if (
    candidates.includes(
      expected,
    )
  ) {
    return true;
  }

  return labelContainsExactComponent(
    feature,
    expectedProvince,
  );
}

function addressAppearsCompatible(
  feature:
    NominatimFeature,
  inputAddress:
    string,
) {
  const expectedStreet =
    normalizeComparable(
      inputAddress
        .split(",")[0],
    );

  if (
    !expectedStreet
  ) {
    return false;
  }

  const geocoding =
    feature.properties
      ?.geocoding;

  const candidateText =
    normalizeComparable(
      [
        geocoding?.street,
        geocoding?.name,
        geocoding?.label,
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        ),
    );

  if (
    !candidateText
  ) {
    return false;
  }

  if (
    candidateText.includes(
      expectedStreet,
    )
  ) {
    return true;
  }

  /*
   * Quitamos términos genéricos para que:
   *
   * Calle El Collado
   *
   * pueda coincidir con:
   *
   * El Collado
   *
   * sin aceptar una dirección completamente distinta.
   */
  const ignoredTokens =
    new Set([
      "calle",
      "c",
      "avenida",
      "av",
      "avda",
      "plaza",
      "paseo",
      "camino",
      "carretera",
      "ctra",
      "via",
      "numero",
      "num",
      "n",
      "de",
      "del",
      "la",
      "las",
      "el",
      "los",
    ]);

  const tokens =
    expectedStreet
      .split(" ")
      .filter(
        (
          token,
        ) =>
          token.length >=
            3 &&
          !ignoredTokens.has(
            token,
          ) &&
          !/^\d+$/.test(
            token,
          ),
      );

  if (
    tokens.length ===
    0
  ) {
    return false;
  }

  const matchedTokens =
    tokens.filter(
      (
        token,
      ) =>
        candidateText.includes(
          token,
        ),
    );

  const requiredMatches =
    tokens.length ===
      1
      ? 1
      : Math.ceil(
          tokens.length *
            0.6,
        );

  return (
    matchedTokens.length >=
    requiredMatches
  );
}

function calculateFeatureScore(
  feature:
    NominatimFeature,
  input:
    EventLocationInput,
  options: {
    requirePostalMatch:
      boolean;

    usedPostalConstraint:
      boolean;
  },
) {
  const coordinates =
    parseCoordinates(
      feature,
    );

  if (
    !coordinates
  ) {
    return null;
  }

  const directCityMatch =
    findDirectCityMatch(
      feature,
      input.city,
    );

  const labelCityMatch =
    labelContainsExactComponent(
      feature,
      input.city,
    );

  /*
   * Ésta es nuestra barrera principal.
   *
   * Nunca aceptamos simplemente features[0].
   * El municipio seleccionado oficialmente debe
   * aparecer de forma verificable en el resultado.
   */
  if (
    !directCityMatch &&
    !labelCityMatch
  ) {
    return null;
  }

  if (
    options.requirePostalMatch &&
    !postalCodeIsCompatible(
      feature,
      input.postalCode,
    )
  ) {
    return null;
  }

  let score =
    0;

  if (
    directCityMatch
  ) {
    score +=
      100;
  } else if (
    labelCityMatch
  ) {
    score +=
      70;
  }

  if (
    provinceAppearsCompatible(
      feature,
      input.province,
    )
  ) {
    score +=
      20;
  }

  if (
    addressAppearsCompatible(
      feature,
      input.address,
    )
  ) {
    score +=
      30;
  }

  if (
    hasExactPostalMatch(
      feature,
      input.postalCode,
    )
  ) {
    score +=
      25;
  }

  return {
    score,

    verified: {
      feature,

      coordinates,

      resolvedCity:
        directCityMatch ||
        clean(
          input.city,
        ),

      usedPostalConstraint:
        options.usedPostalConstraint,
    } satisfies VerifiedFeature,
  };
}

function findVerifiedFeature(
  features:
    readonly NominatimFeature[],
  input:
    EventLocationInput,
  options: {
    requirePostalMatch:
      boolean;

    usedPostalConstraint:
      boolean;
  },
): VerifiedFeature | null {
  const ranked =
    features
      .map(
        (
          feature,
        ) =>
          calculateFeatureScore(
            feature,
            input,
            options,
          ),
      )
      .filter(
        (
          item,
        ): item is NonNullable<
          typeof item
        > =>
          item !==
          null,
      )
      .sort(
        (
          a,
          b,
        ) =>
          b.score -
          a.score,
      );

  return (
    ranked[0]
      ?.verified ??
    null
  );
}

function resolveProvince(
  feature:
    NominatimFeature,
  requestedProvince:
    string,
) {
  const requested =
    clean(
      requestedProvince,
    );

  const normalizedRequested =
    normalizeComparable(
      requested,
    );

  const geocoding =
    feature.properties
      ?.geocoding;

  const candidates =
    [
      clean(
        geocoding?.county,
      ),

      clean(
        geocoding?.state,
      ),
    ].filter(
      Boolean,
    );

  for (
    const candidate of
    candidates
  ) {
    if (
      normalizeComparable(
        candidate,
      ) ===
      normalizedRequested
    ) {
      return candidate;
    }
  }

  /*
   * El catálogo INE es nuestra autoridad para
   * provincia/municipio.
   *
   * OSM puede representar algunos niveles
   * administrativos de manera diferente.
   */
  return requested;
}

function buildStoredAddress(
  input:
    EventLocationInput,
  feature:
    NominatimFeature,
) {
  const label =
    clean(
      feature.properties
        ?.geocoding
        ?.label,
    );

  if (
    label &&
    label.length <=
      300
  ) {
    return label;
  }

  return [
    clean(
      input.address,
    ),

    clean(
      input.city,
    ),

    clean(
      input.province,
    ),
  ]
    .filter(
      Boolean,
    )
    .join(
      ", ",
    )
    .slice(
      0,
      300,
    );
}

function buildStructuredParams(
  input:
    EventLocationInput,
  options: {
    includePostalCode:
      boolean;
  },
) {
  const street =
    buildStreetSearchValue(
      input,
    );

  const params =
    new URLSearchParams({
      street,

      city:
        clean(
          input.city,
        ),

      county:
        clean(
          input.province,
        ),

      country:
        "España",

      format:
        "geocodejson",

      addressdetails:
        "1",

      countrycodes:
        "es",

      limit:
        String(
          MAX_RESULTS,
        ),
    });

  const postalCode =
    normalizePostalCode(
      input.postalCode,
    );

  if (
    options.includePostalCode &&
    postalCode
  ) {
    params.set(
      "postalcode",
      postalCode,
    );
  }

  return params;
}

function buildFreeTextParams(
  input:
    EventLocationInput,
) {
  const street =
    buildStreetSearchValue(
      input,
    );

  const query =
    [
      street,

      clean(
        input.city,
      ),

      clean(
        input.province,
      ),

      "España",
    ]
      .filter(
        Boolean,
      )
      .join(
        ", ",
      );

  return new URLSearchParams({
    q:
      query,

    format:
      "geocodejson",

    addressdetails:
      "1",

    countrycodes:
      "es",

    limit:
      String(
        MAX_RESULTS,
      ),
  });
}

async function executeSearch(
  params:
    URLSearchParams,
): Promise<SearchResult> {
  let response:
    Response;

  try {
    response =
      await fetch(
        `${getBaseUrl()}/search?${params.toString()}`,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            "Accept-Language":
              "es",

            "User-Agent":
              getUserAgent(),
          },

          next: {
            revalidate:
              60 *
              60 *
              24 *
              30,
          },
        },
      );
  } catch {
    throw new Error(
      "El servicio de ubicación no está disponible en este momento.",
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      "El servicio de ubicación no está disponible en este momento.",
    );
  }

  let payload:
    NominatimResponse;

  try {
    payload =
      (await response.json()) as
        NominatimResponse;
  } catch {
    throw new Error(
      "El servicio de ubicación devolvió una respuesta no válida.",
    );
  }

  return {
    features:
      Array.isArray(
        payload.features,
      )
        ? payload.features
        : [],

    attribution:
      clean(
        payload.geocoding
          ?.attribution,
      ) ||
      DEFAULT_ATTRIBUTION,
  };
}

function resolvePostalCode(
  verified:
    VerifiedFeature,
  input:
    EventLocationInput,
) {
  const geocoderPostalCode =
    getFeaturePostalCode(
      verified.feature,
    );

  /*
   * Prioridad absoluta:
   * el CP devuelto por la dirección realmente
   * encontrada.
   */
  if (
    geocoderPostalCode
  ) {
    return geocoderPostalCode;
  }

  /*
   * Solo conservamos el CP escrito manualmente
   * si la búsqueda que produjo el resultado
   * utilizó realmente ese CP como restricción.
   *
   * Si tuvimos que ignorarlo para encontrar
   * correctamente la dirección, podría estar
   * equivocado y no debemos persistirlo.
   */
  if (
    verified.usedPostalConstraint
  ) {
    const requested =
      normalizePostalCode(
        input.postalCode,
      );

    return (
      requested ||
      null
    );
  }

  return null;
}

export async function geocodeEventLocation(
  input:
    EventLocationInput,
): Promise<VerifiedEventLocation> {
  const street =
    buildStreetSearchValue(
      input,
    );

  const city =
    clean(
      input.city,
    );

  const province =
    clean(
      input.province,
    );

  if (
    !street ||
    !city ||
    !province
  ) {
    throw new Error(
      "No hay información suficiente para verificar la ubicación.",
    );
  }

  const requestedPostalCode =
    normalizePostalCode(
      input.postalCode,
    );

  let verified:
    VerifiedFeature | null =
    null;

  let finalAttribution =
    DEFAULT_ATTRIBUTION;

  let sawAnyFeatures =
    false;

  /*
   * ==========================================================
   * INTENTO 1
   * Dirección estructurada + CP proporcionado.
   * ==========================================================
   *
   * Es el caso más preciso.
   */
  if (
    requestedPostalCode
  ) {
    const strictSearch =
      await executeSearch(
        buildStructuredParams(
          input,
          {
            includePostalCode:
              true,
          },
        ),
      );

    finalAttribution =
      strictSearch.attribution;

    if (
      strictSearch.features
        .length >
      0
    ) {
      sawAnyFeatures =
        true;
    }

    verified =
      findVerifiedFeature(
        strictSearch.features,
        input,
        {
          requirePostalMatch:
            true,

          usedPostalConstraint:
            true,
        },
      );
  }

  /*
   * ==========================================================
   * INTENTO 2
   * Dirección estructurada SIN obligar al CP.
   * ==========================================================
   *
   * Esto resuelve:
   *
   * - código postal vacío
   * - código postal escrito incorrectamente
   * - códigos postales que Nominatim no asocia bien
   *
   * Seguimos exigiendo una coincidencia fiable
   * del municipio.
   */
  if (
    !verified
  ) {
    const relaxedSearch =
      await executeSearch(
        buildStructuredParams(
          input,
          {
            includePostalCode:
              false,
          },
        ),
      );

    finalAttribution =
      relaxedSearch.attribution ||
      finalAttribution;

    if (
      relaxedSearch.features
        .length >
      0
    ) {
      sawAnyFeatures =
        true;
    }

    verified =
      findVerifiedFeature(
        relaxedSearch.features,
        input,
        {
          requirePostalMatch:
            false,

          usedPostalConstraint:
            false,
        },
      );
  }

  /*
   * ==========================================================
   * INTENTO 3
   * Búsqueda libre controlada.
   * ==========================================================
   *
   * Nominatim no resuelve todas las direcciones
   * correctamente mediante búsqueda estructurada.
   *
   * Esta búsqueda NO mezcla `q` con los parámetros
   * estructurados.
   *
   * Seguimos verificando el resultado antes de
   * aceptarlo.
   */
  if (
    !verified
  ) {
    const fallbackSearch =
      await executeSearch(
        buildFreeTextParams(
          input,
        ),
      );

    finalAttribution =
      fallbackSearch.attribution ||
      finalAttribution;

    if (
      fallbackSearch.features
        .length >
      0
    ) {
      sawAnyFeatures =
        true;
    }

    verified =
      findVerifiedFeature(
        fallbackSearch.features,
        input,
        {
          requirePostalMatch:
            false,

          usedPostalConstraint:
            false,
        },
      );
  }

  if (
    !verified
  ) {
    if (
      !sawAnyFeatures
    ) {
      throw new Error(
        `No hemos podido encontrar esa dirección en ${city}. Revisa únicamente la calle o el número e inténtalo de nuevo.`,
      );
    }

    throw new Error(
      `Encontramos resultados parecidos, pero ninguno corresponde de forma suficientemente fiable a ${city}. Revisa la dirección antes de continuar.`,
    );
  }

  const resolvedPostalCode =
    resolvePostalCode(
      verified,
      input,
    );

  const storedAddress =
    buildStoredAddress(
      input,
      verified.feature,
    );

  /*
   * Municipio y provincia vienen del selector oficial
   * de LookUp/INE.
   *
   * Nominatim verifica la ubicación física,
   * pero no sustituye nuestro catálogo territorial.
   */
  const resolvedCity =
    clean(
      input.city,
    );

  const resolvedProvince =
    resolveProvince(
      verified.feature,
      province,
    );

  return {
    address:
      storedAddress,

    city:
      resolvedCity,

    cityKey:
      normalizeCityKey(
        resolvedCity,
      ),

    province:
      resolvedProvince,

    postalCode:
      resolvedPostalCode,

    countryCode:
      "ES",

    latitude:
      verified.coordinates
        .latitude,

    longitude:
      verified.coordinates
        .longitude,

    displayName:
      clean(
        verified.feature
          .properties
          ?.geocoding
          ?.label,
      ) ||
      storedAddress,

    attribution:
      finalAttribution,
  };
}