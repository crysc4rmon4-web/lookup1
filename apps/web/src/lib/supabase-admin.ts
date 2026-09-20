import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

let supabaseAdminClient:
  SupabaseClient | null =
  null;

export class SupabaseServerConfigurationError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "SupabaseServerConfigurationError";
  }
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new SupabaseServerConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL no está configurada en el servidor.",
    );
  }

  if (!serviceRoleKey) {
    throw new SupabaseServerConfigurationError(
      "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new SupabaseServerConfigurationError("NEXT_PUBLIC_SUPABASE_URL no es una URL válida.");
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !['', '/'].includes(parsedUrl.pathname) || parsedUrl.search || parsedUrl.hash) {
    throw new SupabaseServerConfigurationError("NEXT_PUBLIC_SUPABASE_URL debe ser la URL base del proyecto, sin rutas ni parámetros.");
  }

  supabaseAdminClient =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );

  return supabaseAdminClient;
}
