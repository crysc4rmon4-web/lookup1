export type GeocodedAddress = {
  address: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  address: string,
): Promise<GeocodedAddress> {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    throw new Error(
      "Introduce una dirección.",
    );
  }

  const params = new URLSearchParams({
    q: normalizedAddress,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "es",
  });

  const response = await fetch(
    `${NOMINATIM_URL}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo localizar la dirección.",
    );
  }

  const results =
    (await response.json()) as NominatimResult[];

  const result = results[0];

  if (
    !result ||
    !result.lat ||
    !result.lon
  ) {
    throw new Error(
      "No encontramos esa dirección. Comprueba que esté escrita correctamente.",
    );
  }

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error(
      "La ubicación obtenida no es válida.",
    );
  }

  return {
    address:
      result.display_name ??
      normalizedAddress,
    latitude,
    longitude,
  };
}