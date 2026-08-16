import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const AVATAR_BUCKET =
  "avatars";

const DELETE_CONFIRMATION =
  "ELIMINAR";

const STORAGE_PAGE_SIZE =
  100;

type DeleteAccountBody = {
  confirmation?: unknown;
};

/*
 * ============================================================
 * ENV
 * ============================================================
 */

function getRequiredEnv(
  name: string,
) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `Missing server environment variable: ${name}`,
    );
  }

  return value;
}

/*
 * ============================================================
 * CLIENTE SUPABASE DE SERVIDOR
 * ============================================================
 *
 * Nunca persiste sesiones.
 *
 * El cliente Auth usa la anon key únicamente para verificar
 * el JWT presentado por el navegador.
 *
 * El cliente Admin usa service_role exclusivamente después
 * de que la identidad del usuario haya sido verificada.
 */

function createServerSupabaseClient(
  key: string,
) {
  const supabaseUrl =
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
    );

  return createClient(
    supabaseUrl,
    key,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,

        detectSessionInUrl:
          false,
      },
    },
  );
}

/*
 * ============================================================
 * BEARER TOKEN
 * ============================================================
 */

function getBearerToken(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (!authorization) {
    return null;
  }

  const [
    scheme,
    token,
  ] =
    authorization.split(
      " ",
    );

  if (
    scheme?.toLowerCase() !==
      "bearer" ||
    !token
  ) {
    return null;
  }

  return token.trim();
}

/*
 * ============================================================
 * DATOS RAW LEGACY IDENTIFICABLES
 * ============================================================
 *
 * analytics_events:
 * - event_data
 * - device_info
 * - session_id
 *
 * audit_logs:
 * - metadata
 * - ip_address
 * - user_agent
 *
 * Aunque los FK fueran SET NULL después de borrar
 * profiles_private, esos campos podrían conservar información
 * identificable.
 *
 * Hasta disponer de una arquitectura real de agregación y
 * anonimización, eliminamos las filas RAW asociadas a la cuenta.
 */

async function deleteLegacyRawData(
  admin:
    SupabaseClient,

  userId: string,
) {
  const {
    data:
      privateProfile,

    error:
      privateProfileError,
  } =
    await admin
      .from(
        "profiles_private",
      )
      .select(
        "id",
      )
      .eq(
        "auth_user_id",
        userId,
      )
      .maybeSingle();

  if (
    privateProfileError
  ) {
    throw new Error(
      `Could not load legacy private profile: ${privateProfileError.message}`,
    );
  }

  if (
    !privateProfile?.id
  ) {
    return;
  }

  const privateProfileId =
    privateProfile.id;

  const {
    error:
      analyticsDeleteError,
  } =
    await admin
      .from(
        "analytics_events",
      )
      .delete()
      .eq(
        "profile_private_id",
        privateProfileId,
      );

  if (
    analyticsDeleteError
  ) {
    throw new Error(
      `Could not delete legacy analytics: ${analyticsDeleteError.message}`,
    );
  }

  const {
    error:
      auditDeleteError,
  } =
    await admin
      .from(
        "audit_logs",
      )
      .delete()
      .eq(
        "actor_profile_id",
        privateProfileId,
      );

  if (
    auditDeleteError
  ) {
    throw new Error(
      `Could not delete legacy audit rows: ${auditDeleteError.message}`,
    );
  }
}

/*
 * ============================================================
 * STORAGE
 * ============================================================
 *
 * uploadAvatar() guarda actualmente:
 *
 * avatars/<userId>/avatar.<extension>
 *
 * No asumimos una extensión concreta porque un usuario puede
 * haber usado JPG, PNG o WebP en distintos momentos.
 *
 * Enumeramos todos los objetos directos de su carpeta y los
 * eliminamos mediante la Storage API.
 */

async function getAvatarPaths(
  admin:
    SupabaseClient,

  userId: string,
) {
  const paths:
    string[] = [];

  let offset = 0;

  while (true) {
    const {
      data,
      error,
    } =
      await admin.storage
        .from(
          AVATAR_BUCKET,
        )
        .list(
          userId,
          {
            limit:
              STORAGE_PAGE_SIZE,

            offset,

            sortBy: {
              column:
                "name",

              order:
                "asc",
            },
          },
        );

    if (error) {
      throw new Error(
        `Could not list avatar objects: ${error.message}`,
      );
    }

    const objects =
      data ?? [];

    for (
      const object
      of objects
    ) {
      /*
       * Los archivos tienen id.
       * Las carpetas virtuales pueden no tenerlo.
       *
       * Nuestro contrato actual de avatars utiliza únicamente
       * archivos directos dentro de <userId>/.
       */
      if (
        object.id &&
        object.name
      ) {
        paths.push(
          `${userId}/${object.name}`,
        );
      }
    }

    if (
      objects.length <
      STORAGE_PAGE_SIZE
    ) {
      break;
    }

    offset +=
      STORAGE_PAGE_SIZE;
  }

  return paths;
}

async function deleteAvatarObjects(
  admin:
    SupabaseClient,

  userId: string,
) {
  const paths =
    await getAvatarPaths(
      admin,
      userId,
    );

  if (
    paths.length === 0
  ) {
    return;
  }

  const {
    error,
  } =
    await admin.storage
      .from(
        AVATAR_BUCKET,
      )
      .remove(
        paths,
      );

  if (error) {
    throw new Error(
      `Could not delete avatar objects: ${error.message}`,
    );
  }
}

/*
 * ============================================================
 * DELETE /api/account/delete
 * ============================================================
 */

export async function DELETE(
  request: Request,
) {
  try {
    /*
     * ----------------------------------------------------------
     * CONFIRMACIÓN FUERTE
     * ----------------------------------------------------------
     *
     * La UI exigirá escribir ELIMINAR.
     *
     * También lo validamos en servidor para que no dependa
     * únicamente del frontend.
     */

    let body:
      DeleteAccountBody | null =
      null;

    try {
      body =
        (await request.json()) as DeleteAccountBody;
    } catch {
      body =
        null;
    }

    if (
      body?.confirmation !==
      DELETE_CONFIRMATION
    ) {
      return NextResponse.json(
        {
          error:
            "La confirmación de eliminación no es válida.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * TOKEN
     * ----------------------------------------------------------
     */

    const accessToken =
      getBearerToken(
        request,
      );

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "No existe una sesión válida para eliminar la cuenta.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * VERIFICACIÓN AUTH
     * ----------------------------------------------------------
     *
     * No confiamos en un userId enviado por el navegador.
     *
     * El único userId válido es el que Supabase devuelve después
     * de verificar el access token.
     */

    const anonKey =
      getRequiredEnv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );

    const authClient =
      createServerSupabaseClient(
        anonKey,
      );

    const {
      data: authData,
      error: authError,
    } =
      await authClient.auth.getUser(
        accessToken,
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "La sesión ha caducado o ya no es válida.",
        },
        {
          status: 401,
        },
      );
    }

    const userId =
      authData.user.id;

    /*
     * ----------------------------------------------------------
     * CLIENTE ADMIN
     * ----------------------------------------------------------
     */

    const serviceRoleKey =
      getRequiredEnv(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    const admin =
      createServerSupabaseClient(
        serviceRoleKey,
      );

    /*
     * ----------------------------------------------------------
     * 1. RAW LEGACY
     * ----------------------------------------------------------
     */

    await deleteLegacyRawData(
      admin,
      userId,
    );

    /*
     * ----------------------------------------------------------
     * 2. STORAGE
     * ----------------------------------------------------------
     *
     * Supabase Auth no permite eliminar usuarios que todavía
     * sean propietarios de objetos Storage.
     */

    await deleteAvatarObjects(
      admin,
      userId,
    );

    /*
     * ----------------------------------------------------------
     * 3. AUTH.USER
     * ----------------------------------------------------------
     *
     * PostgreSQL se encarga a partir de aquí de todas las FK
     * ON DELETE CASCADE que hemos auditado.
     *
     * false = hard delete.
     */

    const {
      error:
        deleteUserError,
    } =
      await admin.auth.admin.deleteUser(
        userId,
        false,
      );

    if (
      deleteUserError
    ) {
      throw new Error(
        `Could not delete Auth user: ${deleteUserError.message}`,
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    /*
     * El detalle técnico solo queda en servidor.
     * Nunca devolvemos service-role, UUIDs internos ni detalles
     * de PostgreSQL al navegador.
     */

    console.error(
      "❌ Error eliminando cuenta LookUp",
      error,
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la cuenta. Tus datos no se consideran eliminados hasta completar todo el proceso.",
      },
      {
        status: 500,
      },
    );
  }
}