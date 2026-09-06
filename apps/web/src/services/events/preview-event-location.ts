export type EventLocationPreview = {
  address:
    string;

  city:
    string;

  cityKey:
    string;

  province:
    string;

  postalCode:
    string | null;

  countryCode:
    "ES";

  latitude:
    number;

  longitude:
    number;

  displayName:
    string;

  attribution:
    string;
};

type PreviewEventLocationInput = {
  accessToken:
    string;

  venueName:
    string;

  address:
    string;

  city:
    string;

  province:
    string;

  postalCode:
    string | null;
};

type PreviewEventLocationResponse = {
  location?:
    EventLocationPreview;

  error?:
    string;
};

export async function previewEventLocation({
  accessToken,
  venueName,
  address,
  city,
  province,
  postalCode,
}: PreviewEventLocationInput): Promise<
  EventLocationPreview
> {
  const token =
    accessToken.trim();

  if (!token) {
    throw new Error(
      "No existe una sesión válida.",
    );
  }

  const response =
    await fetch(
      "/api/events/location/preview",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            venueName,
            address,
            city,
            province,
            postalCode,
          }),

        cache:
          "no-store",
      },
    );

  const payload =
    (await response
      .json()
      .catch(
        () => ({}),
      )) as PreviewEventLocationResponse;

  if (
    !response.ok ||
    !payload.location
  ) {
    throw new Error(
      payload.error ??
      "No se pudo verificar la ubicación.",
    );
  }

  return payload.location;
}