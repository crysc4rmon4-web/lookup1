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

function normalizeOptionalValue(
  value: string | null | undefined,
) {
  const normalized =
    value?.trim() ?? "";

  return normalized || null;
}

export async function getMyBusinessProfile(
  profileId: string,
): Promise<BusinessProfileRow | null> {
  const {
    data,
    error,
  } = await supabase
    .from("business_profiles")
    .select("*")
    .eq(
      "profile_id",
      profileId,
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data as BusinessProfileRow | null
  );
}

export async function saveMyBusinessProfile(
  input: BusinessProfileUpsertInput,
): Promise<BusinessProfileRow> {
  const {
    data,
    error,
  } = await supabase
    .from("business_profiles")
    .upsert(
      {
        profile_id:
          input.profile_id,

        legal_name:
          input.legal_name.trim(),

        trade_name:
          input.trade_name.trim(),

        tax_id:
          input.tax_id
            .trim()
            .toUpperCase(),

        sector:
          input.sector.trim(),

        address:
          input.address.trim(),

        city:
          input.city.trim(),

        province:
          input.province.trim(),

        postal_code:
          input.postal_code.trim(),

        latitude:
          input.latitude ?? null,

        longitude:
          input.longitude ?? null,

        contact_email:
          input.contact_email
            .trim()
            .toLowerCase(),

        contact_phone:
          normalizeOptionalValue(
            input.contact_phone,
          ),

        website:
          normalizeOptionalValue(
            input.website,
          ),
      },
      {
        onConflict: "profile_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BusinessProfileRow;
}