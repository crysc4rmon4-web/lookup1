import { locationNamesMatch } from "@/lib/locations/location-name";

export type GeocodedAddress = {
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  display_name?: string;
  address?: { city?: string; town?: string; village?: string; municipality?: string; county?: string; province?: string; state?: string };
  lat?: string;
  lon?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  address: string,
  options: { cityOnly?: boolean; province?: string; signal?: AbortSignal } = {},
): Promise<GeocodedAddress> {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    throw new Error("Introduce una dirección.");
  }

  const params = new URLSearchParams({
    ...(options.cityOnly ? { city: normalizedAddress } : { q: normalizedAddress }),
    ...(options.province ? { county: options.province } : {}),
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "es",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    ...(options.signal ? { signal: options.signal } : {}),
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo localizar la dirección.");
  }

  const results = (await response.json()) as NominatimResult[];

  const result = results[0];

  if (!result || !result.lat || !result.lon) {
    throw new Error(
      "No encontramos esa dirección. Comprueba que esté escrita correctamente.",
    );
  }

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new Error("La ubicación obtenida no es válida.");
  }

  const city = result.address?.city ?? result.address?.town ?? result.address?.village ?? result.address?.municipality;
  if (options.cityOnly) {
    if (!city || !locationNamesMatch(city, normalizedAddress)) throw new Error("No pudimos confirmar ese municipio. Prueba su otro nombre oficial o inténtalo más tarde.");
  }

  return {
    ...(city ? { city } : {}),
    address: result.display_name ?? normalizedAddress,
    latitude,
    longitude,
  };
}
