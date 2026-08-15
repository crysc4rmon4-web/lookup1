import {
  SOCIAL_PLATFORMS,
} from "@lookup/config";

export function normalizeSocialPlatform(
  platform: string,
) {
  const normalized =
    platform
      .trim()
      .toLowerCase();

  if (
    normalized === "twitter"
  ) {
    return "x";
  }

  if (
    normalized === "web"
  ) {
    return "website";
  }

  return normalized;
}

function hasHttpProtocol(
  value: string,
) {
  return /^https?:\/\//i.test(
    value,
  );
}

function looksLikeDomain(
  value: string,
) {
  return /^(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(
    value,
  );
}

function ensureHttps(
  value: string,
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  if (
    hasHttpProtocol(
      trimmed,
    )
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith(
      "//",
    )
  ) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}

export function normalizeWebsiteUrl(
  value: string,
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  return ensureHttps(
    trimmed,
  );
}

export function getSocialPlatformLabel(
  platform: string,
) {
  const normalized =
    normalizeSocialPlatform(
      platform,
    );

  const config =
    SOCIAL_PLATFORMS.find(
      (item) =>
        item.id === normalized,
    );

  if (config) {
    return config.name;
  }

  if (
    normalized === "x"
  ) {
    return "X";
  }

  if (
    normalized === "website"
  ) {
    return "Web";
  }

  return platform;
}

export function buildSocialProfileUrl(
  platform: string,
  value: string,
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  /*
   * ============================================================
   * URL COMPLETA
   * ============================================================
   *
   * Ej:
   * https://instagram.com/crys
   */

  if (
    hasHttpProtocol(
      trimmed,
    )
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith(
      "//",
    )
  ) {
    return `https:${trimmed}`;
  }

  /*
   * ============================================================
   * DOMINIO SIN PROTOCOLO
   * ============================================================
   *
   * Ej:
   * instagram.com/crys
   * github.com/crys
   */

  if (
    looksLikeDomain(
      trimmed,
    )
  ) {
    return ensureHttps(
      trimmed,
    );
  }

  const normalizedPlatform =
    normalizeSocialPlatform(
      platform,
    );

  /*
   * ============================================================
   * WEBSITE
   * ============================================================
   */

  if (
    normalizedPlatform ===
    "website"
  ) {
    return normalizeWebsiteUrl(
      trimmed,
    );
  }

  /*
   * ============================================================
   * CONFIGURACIÓN CENTRAL
   * ============================================================
   *
   * Utilizamos la misma configuración
   * que el onboarding.
   *
   * Así evitamos mantener otra lista
   * independiente de redes.
   */

  const config =
    SOCIAL_PLATFORMS.find(
      (item) =>
        item.id ===
        normalizedPlatform,
    );

  const prefix =
    config?.prefix?.trim();

  /*
   * Si una plataforma no posee una
   * estructura de perfil conocida,
   * no inventamos una URL.
   */

  if (!prefix) {
    return null;
  }

  /*
   * Aceptamos:
   *
   * crys
   * @crys
   * /crys
   */

  const identifier =
    trimmed
      .replace(/^@+/, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

  if (!identifier) {
    return null;
  }

  /*
   * ============================================================
   * USUARIO PEGÓ LA URL SIN HTTPS
   * ============================================================
   *
   * Algunos podrían introducir:
   *
   * instagram.com/crys
   *
   * aunque el campo normalmente espere
   * únicamente el username.
   */

  const normalizedPrefix =
    prefix
      .replace(
        /^https?:\/\//i,
        "",
      )
      .replace(
        /^www\./i,
        "",
      );

  const comparableIdentifier =
    identifier
      .replace(
        /^www\./i,
        "",
      );

  if (
    comparableIdentifier
      .toLowerCase()
      .startsWith(
        normalizedPrefix
          .toLowerCase(),
      )
  ) {
    return ensureHttps(
      comparableIdentifier,
    );
  }

  /*
   * También soportamos configuraciones
   * futuras del estilo:
   *
   * https://service.com/{username}
   */

  if (
    prefix.includes(
      "{username}",
    )
  ) {
    return ensureHttps(
      prefix.replace(
        "{username}",
        identifier,
      ),
    );
  }

  /*
   * Caso normal actual:
   *
   * prefix:
   * https://instagram.com/
   *
   * valor:
   * crys
   *
   * resultado:
   * https://instagram.com/crys
   */

  return ensureHttps(
    `${prefix}${identifier}`,
  );
}