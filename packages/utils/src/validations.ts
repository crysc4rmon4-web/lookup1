export const normalizeSpaces = (value: string) => {
  return value.trim().replace(/\s+/g, " ");
};

export const normalizeEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const validateFullName = (name: string) => {
  const cleaned = normalizeSpaces(name);

  const validCharacters =
    /^[A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)+$/;

  if (!cleaned) {
    return "El nombre es obligatorio";
  }

  if (cleaned.length < 3) {
    return "Nombre demasiado corto";
  }

  if (cleaned.length > 50) {
    return "Nombre demasiado largo";
  }

  if (!validCharacters.test(cleaned)) {
    return "Introduce nombre y apellido válidos";
  }

  return "";
};

export const validateEmail = (email: string) => {
  const cleaned = normalizeEmail(email);

  const pattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!cleaned) {
    return "Email obligatorio";
  }

  if (!pattern.test(cleaned)) {
    return "Email inválido";
  }

  return "";
};

export const validatePassword = (
  password: string,
) => {

  if (password.length < 8) {
    return "Debe tener mínimo 8 caracteres";
  }

  if (!/[A-Z]/.test(password)) {
    return "Debe tener una mayúscula";
  }

  if (!/[0-9]/.test(password)) {
    return "Debe tener un número";
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Debe tener un símbolo";
  }

  return "";
};