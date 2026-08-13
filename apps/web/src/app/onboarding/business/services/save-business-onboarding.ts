import { completeBusinessOnboarding } from "@lookup/services";

import type { BusinessOnboardingData } from "../types";

type SaveBusinessOnboardingParams = {
  userId: string;
  email: string;
  data: BusinessOnboardingData;
};

function normalizeWebsite(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function saveBusinessOnboarding({
  userId,
  email,
  data,
}: SaveBusinessOnboardingParams) {
  if (!email.trim()) {
    throw new Error("No se pudo recuperar el email de la cuenta.");
  }

  if (data.latitude === null || data.longitude === null) {
    throw new Error("Debes verificar la dirección del negocio.");
  }

  return completeBusinessOnboarding({
    userId,

    legalName: data.legalName,
    tradeName: data.tradeName,
    taxId: data.taxId,
    sector: data.sector,

    address: data.address,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,

    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone.trim() || null,
    website: normalizeWebsite(data.website),

    socialLinks: data.socialLinks
      .map((link) => ({
        platform: link.platform.trim(),
        url: link.url.trim(),
      }))
      .filter((link) => Boolean(link.platform) && Boolean(link.url)),

    avatarUrl: data.avatarUrl.trim() || null,

    latitude: data.latitude,
    longitude: data.longitude,
  });
}