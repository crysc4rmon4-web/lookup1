import {
  NextResponse,
} from "next/server";

import {
  geocodeEventLocation,
} from "@/lib/events/geocode-event-location";

import {
  getSupabaseAdminClient,
  SupabaseServerConfigurationError,
} from "@/lib/supabase-admin";

export const maxDuration = 60;

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type LocationPreviewInput = {
  venueName?: unknown;
  address?: unknown;
  city?: unknown;
  province?: unknown;
  postalCode?: unknown;
};

function noStoreHeaders() {
  return {
    "Cache-Control":
      "no-store",
  };
}

function getBearerToken(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }

  return (
    authorization
      .slice(7)
      .trim() ||
    null
  );
}

function readRequiredText(
  value: unknown,
  label: string,
) {
  const normalized =
    typeof value ===
      "string"
      ? value
        .trim()
        .replace(
          /\s+/g,
          " ",
        )
      : "";

  if (!normalized) {
    throw new Error(
      `${label} es obligatorio.`,
    );
  }

  return normalized;
}

function readPostalCode(
  value: unknown,
) {
  if (
    value ===
    null ||
    value ===
    undefined
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "El código postal no es válido.",
    );
  }

  return (
    value.trim() ||
    null
  );
}

export async function POST(
  request: Request,
) {
  try {
    const accessToken =
      getBearerToken(
        request,
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    const supabaseAdmin =
      getSupabaseAdminClient();

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken,
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "La sesión no es válida.",
        },
        {
          status: 401,
          headers:
            noStoreHeaders(),
        },
      );
    }

    let body:
      LocationPreviewInput;

    try {
      body =
        (await request.json()) as LocationPreviewInput;
    } catch {
      return NextResponse.json(
        {
          error:
            "Los datos de ubicación no son válidos.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    let venueName:
      string;

    let address:
      string;

    let city:
      string;

    let province:
      string;

    let postalCode:
      string | null;

    try {
      venueName =
        readRequiredText(
          body.venueName,
          "El lugar",
        );

      address =
        readRequiredText(
          body.address,
          "La dirección",
        );

      city =
        readRequiredText(
          body.city,
          "El municipio",
        );

      province =
        readRequiredText(
          body.province,
          "La provincia",
        );

      postalCode =
        readPostalCode(
          body.postalCode,
        );
    } catch (
    validationError
    ) {
      return NextResponse.json(
        {
          error:
            validationError instanceof
              Error
              ? validationError.message
              : "La ubicación no es válida.",
        },
        {
          status: 400,
          headers:
            noStoreHeaders(),
        },
      );
    }

    try {
      const location =
        await geocodeEventLocation({
          venueName,
          address,
          city,
          province,
          postalCode,
        });

      return NextResponse.json(
        {
          location,
        },
        {
          status: 200,
          headers:
            noStoreHeaders(),
        },
      );
    } catch (
    geocodeError
    ) {
      return NextResponse.json(
        {
          error:
            geocodeError instanceof
              Error
              ? geocodeError.message
              : "No se pudo verificar la ubicación.",
        },
        {
          status: 422,
          headers:
            noStoreHeaders(),
        },
      );
    }
  } catch (error) {
    if (error instanceof SupabaseServerConfigurationError) {
      console.error("Configuración de eventos:", error.message);
      return NextResponse.json({ error: "Los eventos no están disponibles por un problema de configuración del servidor. Contacta con el equipo de LookUp.", code: "EVENTS_CONFIGURATION" }, { status: 503, headers: noStoreHeaders() });
    }

    console.error(
      "❌ Error verificando ubicación del evento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo verificar la ubicación.",
      },
      {
        status: 500,
        headers:
          noStoreHeaders(),
      },
    );
  }
}