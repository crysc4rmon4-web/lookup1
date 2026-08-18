import "server-only";

export type EventReadinessStatus =
  | "ready"
  | "strong"
  | "needs_work"
  | "incomplete";

export type EventReadinessCheckId =
  | "title"
  | "description"
  | "category"
  | "tags"
  | "audience"
  | "location"
  | "schedule"
  | "action";

export type EventReadinessCheck = {
  id:
    EventReadinessCheckId;

  label:
    string;

  score:
    number;

  maxScore:
    number;

  passed:
    boolean;

  message:
    string;
};

export type EventReadinessInput = {
  title: string;

  description: string;

  category: string;

  tags:
    readonly string[];

  audience:
    readonly string[];

  venueName: string;

  address: string;

  city: string;

  province: string;

  startAt:
    | string
    | Date;

  endAt:
    | string
    | Date;

  isFree: boolean;

  priceFrom:
    | number
    | null;

  externalUrl:
    | string
    | null;

  externalActionLabel:
    | string
    | null;
};

export type EventReadinessResult = {
  score:
    number;

  status:
    EventReadinessStatus;

  checks:
    EventReadinessCheck[];

  strengths:
    string[];

  improvements:
    string[];
};

function clean(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ") ||
    ""
  );
}

function parseDate(
  value:
    | string
    | Date,
) {
  if (
    value instanceof Date
  ) {
    return value;
  }

  return new Date(
    value,
  );
}

function getStatus(
  score: number,
): EventReadinessStatus {
  if (score >= 85) {
    return "ready";
  }

  if (score >= 70) {
    return "strong";
  }

  if (score >= 50) {
    return "needs_work";
  }

  return "incomplete";
}

export function calculateEventReadiness(
  input: EventReadinessInput,
  now = new Date(),
): EventReadinessResult {
  const checks:
    EventReadinessCheck[] =
    [];

  const strengths:
    string[] =
    [];

  const improvements:
    string[] =
    [];

  /*
   * ============================================================
   * 1. TÍTULO — 10
   * ============================================================
   */

  const title =
    clean(
      input.title,
    );

  let titleScore =
    0;

  if (
    title.length >= 12
  ) {
    titleScore =
      10;

    strengths.push(
      "El título tiene suficiente contexto para comunicar la propuesta.",
    );
  } else if (
    title.length >= 6
  ) {
    titleScore =
      7;

    improvements.push(
      "Haz el título un poco más específico para que se entienda mejor la experiencia.",
    );
  } else if (
    title.length >= 3
  ) {
    titleScore =
      4;

    improvements.push(
      "El título es demasiado genérico. Añade qué ocurrirá o qué hace diferente al evento.",
    );
  } else {
    improvements.push(
      "Añade un título claro para el evento.",
    );
  }

  checks.push({
    id:
      "title",

    label:
      "Título",

    score:
      titleScore,

    maxScore:
      10,

    passed:
      titleScore === 10,

    message:
      titleScore === 10
        ? "El título comunica suficientemente la propuesta."
        : "El título puede aportar más contexto.",
  });

  /*
   * ============================================================
   * 2. DESCRIPCIÓN — 20
   * ============================================================
   */

  const description =
    clean(
      input.description,
    );

  let descriptionScore =
    0;

  if (
    description.length >=
    220
  ) {
    descriptionScore =
      20;

    strengths.push(
      "La descripción ofrece un nivel de detalle sólido.",
    );
  } else if (
    description.length >=
    120
  ) {
    descriptionScore =
      16;

    strengths.push(
      "La descripción explica razonablemente la propuesta.",
    );

    improvements.push(
      "Puedes reforzar la descripción explicando con más detalle qué vivirá o se llevará el asistente.",
    );
  } else if (
    description.length >=
    60
  ) {
    descriptionScore =
      11;

    improvements.push(
      "Amplía la descripción: explica qué ocurrirá, qué podrá hacer el asistente y qué hace especial la experiencia.",
    );
  } else if (
    description.length >=
    30
  ) {
    descriptionScore =
      7;

    improvements.push(
      "La descripción todavía es demasiado breve para explicar bien la experiencia.",
    );
  } else {
    improvements.push(
      "Añade una descripción completa del evento.",
    );
  }

  checks.push({
    id:
      "description",

    label:
      "Descripción",

    score:
      descriptionScore,

    maxScore:
      20,

    passed:
      descriptionScore >=
      16,

    message:
      descriptionScore >=
      16
        ? "La propuesta está suficientemente explicada."
        : "La descripción necesita más contexto.",
  });

  /*
   * ============================================================
   * 3. CATEGORÍA — 10
   * ============================================================
   */

  const category =
    clean(
      input.category,
    );

  const categoryScore =
    category
      ? 10
      : 0;

  if (category) {
    strengths.push(
      "El evento está clasificado dentro de una categoría clara.",
    );
  } else {
    improvements.push(
      "Selecciona una categoría para que LookUp pueda situar correctamente el evento.",
    );
  }

  checks.push({
    id:
      "category",

    label:
      "Categoría",

    score:
      categoryScore,

    maxScore:
      10,

    passed:
      categoryScore ===
      10,

    message:
      category
        ? "Categoría definida."
        : "Falta una categoría.",
  });

  /*
   * ============================================================
   * 4. TAGS / VIBE — 10
   * ============================================================
   */

  const tags =
    input.tags
      .map(clean)
      .filter(Boolean);

  let tagsScore =
    0;

  if (
    tags.length >= 3
  ) {
    tagsScore =
      10;

    strengths.push(
      "Las etiquetas describen mejor el tono o tipo de experiencia.",
    );
  } else if (
    tags.length === 2
  ) {
    tagsScore =
      8;

    improvements.push(
      "Una etiqueta adicional puede ayudar a LookUp a distinguir mejor la experiencia.",
    );
  } else if (
    tags.length === 1
  ) {
    tagsScore =
      5;

    improvements.push(
      "Añade más etiquetas que describan el ambiente o la experiencia: por ejemplo tranquilo, social, misterio o al aire libre.",
    );
  } else {
    improvements.push(
      "Añade etiquetas de experiencia para conectar el evento con intenciones más concretas.",
    );
  }

  checks.push({
    id:
      "tags",

    label:
      "Etiquetas",

    score:
      tagsScore,

    maxScore:
      10,

    passed:
      tagsScore === 10,

    message:
      tags.length >= 3
        ? "La experiencia está bien descrita con etiquetas."
        : "Las etiquetas pueden ser más precisas.",
  });

  /*
   * ============================================================
   * 5. AUDIENCIA — 10
   * ============================================================
   */

  const audience =
    input.audience
      .map(clean)
      .filter(Boolean);

  let audienceScore =
    0;

  if (
    audience.length >= 2
  ) {
    audienceScore =
      10;

    strengths.push(
      "El público objetivo está definido.",
    );
  } else if (
    audience.length === 1
  ) {
    audienceScore =
      7;

    strengths.push(
      "Existe una primera definición del público objetivo.",
    );

    improvements.push(
      "Puedes concretar un poco más para quién está pensada la experiencia.",
    );
  } else {
    improvements.push(
      "Indica para quién está pensado el evento: familias, parejas, profesionales, estudiantes, adultos u otros públicos.",
    );
  }

  checks.push({
    id:
      "audience",

    label:
      "Público",

    score:
      audienceScore,

    maxScore:
      10,

    passed:
      audienceScore ===
      10,

    message:
      audience.length > 0
        ? "Existe una audiencia explícita."
        : "Todavía no se ha definido el público.",
  });

  /*
   * ============================================================
   * 6. UBICACIÓN — 15
   * ============================================================
   */

  const locationComplete =
    Boolean(
      clean(
        input.venueName,
      ) &&
      clean(
        input.address,
      ) &&
      clean(
        input.city,
      ) &&
      clean(
        input.province,
      ),
    );

  const locationScore =
    locationComplete
      ? 15
      : 0;

  if (
    locationComplete
  ) {
    strengths.push(
      "La ubicación contiene lugar, dirección, ciudad y provincia.",
    );
  } else {
    improvements.push(
      "Completa y verifica la ubicación del evento.",
    );
  }

  checks.push({
    id:
      "location",

    label:
      "Ubicación",

    score:
      locationScore,

    maxScore:
      15,

    passed:
      locationComplete,

    message:
      locationComplete
        ? "Ubicación completa."
        : "La ubicación está incompleta.",
  });

  /*
   * ============================================================
   * 7. HORARIO — 15
   * ============================================================
   */

  const startAt =
    parseDate(
      input.startAt,
    );

  const endAt =
    parseDate(
      input.endAt,
    );

  const startTime =
    startAt.getTime();

  const endTime =
    endAt.getTime();

  const validDates =
    Number.isFinite(
      startTime,
    ) &&
    Number.isFinite(
      endTime,
    );

  const durationMinutes =
    validDates
      ? (
          endTime -
          startTime
        ) /
        60_000
      : 0;

  const future =
    validDates &&
    startTime >
      now.getTime();

  const chronological =
    validDates &&
    endTime >
      startTime;

  let scheduleScore =
    0;

  if (
    future &&
    chronological &&
    durationMinutes >= 30 &&
    durationMinutes <=
      24 * 60
  ) {
    scheduleScore =
      15;

    strengths.push(
      "El horario está definido y tiene una duración clara.",
    );
  } else if (
    future &&
    chronological
  ) {
    scheduleScore =
      12;

    improvements.push(
      "Revisa la duración del evento para asegurarte de que representa correctamente la experiencia.",
    );
  } else {
    improvements.push(
      "Define un inicio futuro y una finalización posterior al inicio.",
    );
  }

  checks.push({
    id:
      "schedule",

    label:
      "Fecha y hora",

    score:
      scheduleScore,

    maxScore:
      15,

    passed:
      scheduleScore ===
      15,

    message:
      scheduleScore === 15
        ? "Horario correctamente definido."
        : "El horario necesita revisión.",
  });

  /*
   * ============================================================
   * 8. ACCIÓN / PRECIO — 10
   * ============================================================
   */

  const externalUrl =
    clean(
      input.externalUrl,
    );

  const externalActionLabel =
    clean(
      input.externalActionLabel,
    );

  let actionScore =
    0;

  if (
    input.isFree
  ) {
    if (externalUrl) {
      actionScore =
        10;

      strengths.push(
        "El usuario dispone de una acción clara para continuar fuera de LookUp.",
      );
    } else {
      actionScore =
        8;

      strengths.push(
        "El evento gratuito tiene una propuesta de acceso sencilla.",
      );
    }
  } else if (
    input.priceFrom !==
      null &&
    input.priceFrom >= 0 &&
    externalUrl
  ) {
    actionScore =
      10;

    strengths.push(
      "El precio y la vía para continuar o reservar están definidos.",
    );
  } else if (
    input.priceFrom !==
      null &&
    input.priceFrom >= 0
  ) {
    actionScore =
      6;

    improvements.push(
      "El precio está definido, pero falta un enlace donde el usuario pueda reservar, comprar o ampliar información.",
    );
  } else {
    improvements.push(
      "Aclara el precio y cómo puede continuar el usuario si está interesado.",
    );
  }

  if (
    externalUrl &&
    !externalActionLabel
  ) {
    improvements.push(
      "Añade una etiqueta clara para la acción externa, como Reservar, Comprar entradas o Más información.",
    );
  }

  checks.push({
    id:
      "action",

    label:
      "Acción",

    score:
      actionScore,

    maxScore:
      10,

    passed:
      actionScore >= 8,

    message:
      actionScore >= 8
        ? "La siguiente acción está suficientemente clara."
        : "La acción final puede ser más clara.",
  });

  /*
   * ============================================================
   * RESULTADO
   * ============================================================
   */

  const score =
    checks.reduce(
      (
        total,
        check,
      ) =>
        total +
        check.score,
      0,
    );

  return {
    score,

    status:
      getStatus(
        score,
      ),

    checks,

    strengths:
      Array.from(
        new Set(
          strengths,
        ),
      ),

    improvements:
      Array.from(
        new Set(
          improvements,
        ),
      ),
  };
}