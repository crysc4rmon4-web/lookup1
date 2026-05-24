export const PASSWORD_MIN_LENGTH = 8;

export function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeFullName(value: string) {
  return normalizeSpaces(value);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateFullName(value: string) {
  const cleaned = normalizeFullName(value);

  const validCharacters =
    /^[A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)+$/;

  if (!cleaned) {
    return "El nombre es obligatorio";
  }

  if (cleaned.length < 3) {
    return "El nombre es demasiado corto";
  }

  if (cleaned.length > 50) {
    return "El nombre es demasiado largo";
  }

  if (!validCharacters.test(cleaned)) {
    return "Introduce nombre y apellido válidos";
  }

  return null;
}

export function isValidEmail(value: string) {
  const cleaned = normalizeEmail(value);

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    cleaned,
  );
}

export function validateEmail(value: string) {
  const cleaned = normalizeEmail(value);

  if (!cleaned) {
    return "El email es obligatorio";
  }

  if (!isValidEmail(cleaned)) {
    return "Introduce un email válido";
  }

  return null;
}

export function getPasswordError(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "La contraseña debe tener mínimo 8 caracteres";
  }

  if (/\s/.test(password)) {
    return "La contraseña no puede contener espacios";
  }

  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir una mayúscula";
  }

  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir una minúscula";
  }

  if (!/[0-9]/.test(password)) {
    return "La contraseña debe incluir un número";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir un símbolo";
  }

  return null;
}

export function isPasswordStrong(
  password: string,
) {
  return getPasswordError(password) === null;
}