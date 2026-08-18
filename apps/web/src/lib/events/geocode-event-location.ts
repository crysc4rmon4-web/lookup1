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
  province: string;
  postalCode: string | null;
  countryCode: "ES";

  latitude: number;
  longitude: number;

  attribution: string;
};

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
};

const DEFAULT_NOMINATIM_URL =
  "https://nominatim.openstreetmap.org";

const DEFAULT_USER_AGENT =
  "LookUp/1.0";

const MAX_RESULTS =
  5;

function clean(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ") ||
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

/*
 * Nominatim permite búsquedas estructuradas.
 *
 * No debemos enviar:
 *
 * Plaza Mayor, Soria,
 * 42002, Soria, Soria, España
 *
 * como una sola cadena.
 *
 * Separamos:
 *
 * street
 * city
 * county
 * postalcode
 * country
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

  const administrativeValues =
    new Set(
      [
        input.city,
        input.province,
        input.postalCode,
        "España",
        "Spain",
      ]
        .map(
          normalizeComparable,
        )
        .filter(Boolean),
    );

  const parts =
    address
      .split(",")
      .map(clean)
      .filter(Boolean);

  const streetParts =
    parts.filter(
      (part) =>
        !administrativeValues.has(
          normalizeComparable(
            part,
          ),
        ),
    );

  const street =
    clean(
      streetParts.join(
        ", ",
      ),
    );

  return (
    street ||
    address
  );
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
  ].filter(Boolean);
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

  if (!normalizedExpected) {
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

  if (!expected) {
    return true;
  }

  const actual =
    getFeaturePostalCode(
      feature,
    );

  /*
   * Si Nominatim no conoce el código postal,
   * no descartamos un resultado cuya ciudad
   * haya sido verificada directamente.
   */
  if (!actual) {
    return true;
  }

  return (
    actual ===
    expected
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
      expected === actual,
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
      (component) =>
        component ===
        expected,
    );
}

function findVerifiedFeature(
  features:
    readonly NominatimFeature[],
  input:
    EventLocationInput,
): VerifiedFeature | null {
  /*
   * PRIORIDAD 1
   *
   * Ciudad explícitamente devuelta
   * por Nominatim.
   */
  for (
    const feature of
    features
  ) {
    const coordinates =
      parseCoordinates(
        feature,
      );

    if (!coordinates) {
      continue;
    }

    const cityMatch =
      findDirectCityMatch(
        feature,
        input.city,
      );

    if (!cityMatch) {
      continue;
    }

    if (
      !postalCodeIsCompatible(
        feature,
        input.postalCode,
      )
    ) {
      continue;
    }

    return {
      feature,

      coordinates,

      resolvedCity:
        cityMatch,
    };
  }

  /*
   * PRIORIDAD 2
   *
   * GeocodeJSON no garantiza que todos los
   * componentes administrativos estén siempre
   * disponibles.
   *
   * Si no existe city/locality/district,
   * aceptamos un resultado únicamente cuando:
   *
   * - el código postal coincide exactamente
   * - la etiqueta contiene la ciudad como
   *   componente completo
   *
   * Esto evita volver al comportamiento
   * inseguro de aceptar features[0].
   */
  if (
    input.postalCode
  ) {
    for (
      const feature of
      features
    ) {
      const coordinates =
        parseCoordinates(
          feature,
        );

      if (!coordinates) {
        continue;
      }

      if (
        !hasExactPostalMatch(
          feature,
          input.postalCode,
        )
      ) {
        continue;
      }

      if (
        !labelContainsExactComponent(
          feature,
          input.city,
        )
      ) {
        continue;
      }

      return {
        feature,

        coordinates,

        resolvedCity:
          clean(
            input.city,
          ),
      };
    }
  }

  return null;
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
    ].filter(Boolean);

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
   * Niveles administrativos de OSM
   * no siempre corresponden exactamente
   * a provincia/comunidad autónoma.
   *
   * Como la ciudad ya ha sido validada,
   * conservamos aquí la provincia indicada.
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
    .filter(Boolean)
    .join(", ")
    .slice(
      0,
      300,
    );
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

  /*
   * Búsqueda estructurada oficial de Nominatim.
   *
   * Importante:
   * no mezclamos `q` con parámetros estructurados.
   */
  const params =
    new URLSearchParams({
      street,

      city,

      county:
        province,

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
    clean(
      input.postalCode,
    );

  if (postalCode) {
    params.set(
      "postalcode",
      postalCode,
    );
  }

  const response =
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

  if (!response.ok) {
    throw new Error(
      "El servicio de ubicación no está disponible en este momento.",
    );
  }

  const payload =
    (await response.json()) as
      NominatimResponse;

  const features =
    payload.features ??
    [];

  if (
    features.length ===
    0
  ) {
    throw new Error(
      `No hemos podido encontrar esa dirección en ${city}. Revisa la dirección, la ciudad y el código postal.`,
    );
  }

  const verified =
    findVerifiedFeature(
      features,
      input,
    );

  if (!verified) {
    throw new Error(
      `La dirección encontrada no corresponde de forma fiable a ${city}. Revisa la dirección, la ciudad y el código postal antes de continuar.`,
    );
  }

  const geocoding =
    verified.feature
      .properties
      ?.geocoding;

  const resolvedPostalCode =
    clean(
      geocoding?.postcode,
    ) ||
    postalCode ||
    null;

  return {
    address:
      buildStoredAddress(
        input,
        verified.feature,
      ),

    city:
      verified.resolvedCity,

    province:
      resolveProvince(
        verified.feature,
        province,
      ),

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

    attribution:
      clean(
        payload.geocoding
          ?.attribution,
      ) ||
      "Data © OpenStreetMap contributors, ODbL 1.0",
  };
}