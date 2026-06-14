export const PASSWORD_MIN_LENGTH = 8;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

export function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").trim();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUsername(value: string) {
  const username = normalizeUsername(value);

  return (
    username.length >= USERNAME_MIN_LENGTH &&
    username.length <= USERNAME_MAX_LENGTH &&
    /^[a-z0-9._]+$/.test(username) &&
    !username.startsWith(".") &&
    !username.endsWith(".") &&
    !username.includes("..")
  );
}

export function getPasswordError(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "La contraseña debe tener mínimo 8 caracteres";
  }

  if (/\s/.test(password)) {
    return "La contraseña no puede contener espacios";
  }

  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una mayúscula";
  }

  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una minúscula";
  }

  if (!/[0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un número";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un símbolo";
  }

  return null;
}

export function isPasswordStrong(password: string) {
  return getPasswordError(password) === null;
}