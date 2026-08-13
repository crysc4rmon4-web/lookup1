import { supabase } from "./supabase/client";

export type BusinessProfileRow = {
  profile_id: string;

  legal_name: string;
  trade_name: string;
  tax_id: string;
  sector: string;

  address: string;
  city: string;
  province: string;
  postal_code: string;

  latitude: number | null;
  longitude: number | null;

  contact_email: string;
  contact_phone: string | null;
  website: string | null;

  created_at: string;
  updated_at: string;
};

export type BusinessProfileUpsertInput = {
  profile_id: string;

  legal_name: string;
  trade_name: string;
  tax_id: string;
  sector: string;

  address: string;
  city: string;
  province: string;
  postal_code: string;

  latitude?: number | null;
  longitude?: number | null;

  contact_email: string;
  contact_phone?: string | null;
  website?: string | null;
};

export type BusinessSocialLinkInput = {
  platform: string;
  url: string;
};

export type CompleteBusinessOnboardingInput = {
  userId: string;

  legalName: string;
  tradeName: string;
  taxId: string;
  sector: string;
  bio: string;

  address: string;
  city: string;
  province: string;
  postalCode: string;

  contactEmail: string;
  contactPhone: string | null;
  website: string | null;

  socialLinks: BusinessSocialLinkInput[];

  avatarUrl: string | null;

  latitude: number | null;
  longitude: number | null;
};

type DatabaseErrorLike = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

function createDatabaseError(context: string, error: DatabaseErrorLike) {
  const details = [
    error.message,
    error.details,
    error.hint,
    error.code ? `Código ${error.code}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return new Error(details ? `${context}: ${details}` : context);
}

function normalizeOptionalValue(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized || null;
}

export async function getMyBusinessProfile(
  profileId: string,
): Promise<BusinessProfileRow | null> {
  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw createDatabaseError("No se pudo cargar el perfil de empresa", error);
  }

  return data as BusinessProfileRow | null;
}

export async function saveMyBusinessProfile(
  input: BusinessProfileUpsertInput,
): Promise<BusinessProfileRow> {
  const { data, error } = await supabase
    .from("business_profiles")
    .upsert(
      {
        profile_id: input.profile_id,

        legal_name: input.legal_name.trim(),
        trade_name: input.trade_name.trim(),
        tax_id: input.tax_id.trim().toUpperCase(),
        sector: input.sector.trim(),

        address: input.address.trim(),
        city: input.city.trim(),
        province: input.province.trim(),
        postal_code: input.postal_code.trim(),

        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,

        contact_email: input.contact_email.trim().toLowerCase(),

        contact_phone: normalizeOptionalValue(input.contact_phone),
        website: normalizeOptionalValue(input.website),
      },
      {
        onConflict: "profile_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw createDatabaseError("No se pudo guardar el perfil de empresa", error);
  }

  return data as BusinessProfileRow;
}

export async function completeBusinessOnboarding(
  input: CompleteBusinessOnboardingInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("complete_business_onboarding", {
    p_legal_name: input.legalName.trim(),
    p_trade_name: input.tradeName.trim(),
    p_tax_id: input.taxId.trim().toUpperCase(),
    p_sector: input.sector.trim(),
    p_bio: input.bio.trim(),

    p_address: input.address.trim(),
    p_city: input.city.trim(),
    p_province: input.province.trim(),
    p_postal_code: input.postalCode.trim(),

    p_contact_email: input.contactEmail.trim().toLowerCase(),
    p_contact_phone: normalizeOptionalValue(input.contactPhone),
    p_website: normalizeOptionalValue(input.website),

    p_social_links: input.socialLinks,

    p_avatar_url: input.avatarUrl,

    p_latitude: input.latitude,
    p_longitude: input.longitude,
  });

  if (error) {
    throw createDatabaseError(
      "No se pudo finalizar el onboarding de empresa",
      error,
    );
  }

  if (typeof data !== "string") {
    throw new Error(
      "Supabase no confirmó la finalización del onboarding de empresa.",
    );
  }

  if (data !== input.userId) {
    throw new Error(
      "La cuenta confirmada por Supabase no coincide con la sesión actual.",
    );
  }

  return data;
}