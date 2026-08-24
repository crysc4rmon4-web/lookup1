import "server-only";

import type {
  EventDiscoveryDateScope,
} from "./event-discovery-preferences";

const LOOKUP_EVENT_TIME_ZONE =
  "Europe/Madrid";

type LocalCalendarDate = {
  year:
  number;

  month:
  number;

  day:
  number;
};

export type EventDiscoveryDateRange = {
  fromIso:
  string;

  toIso:
  string | null;
};

type GetEventDiscoveryDateRangeInput = {
  scope:
  EventDiscoveryDateScope;

  dateFrom?:
  string | null;

  dateTo?:
  string | null;

  now?:
  Date;
};

function getNumericPart(
  parts:
    Intl.DateTimeFormatPart[],

  type:
    Intl.DateTimeFormatPartTypes,
) {
  const value =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        type,
    )?.value;

  const parsed =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    throw new Error(
      `No se pudo resolver la parte temporal ${type}.`,
    );
  }

  return parsed;
}

function getLocalCalendarDate(
  date:
    Date,
): LocalCalendarDate {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          LOOKUP_EVENT_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    ).formatToParts(
      date,
    );

  return {
    year:
      getNumericPart(
        parts,
        "year",
      ),

    month:
      getNumericPart(
        parts,
        "month",
      ),

    day:
      getNumericPart(
        parts,
        "day",
      ),
  };
}

function getTimeZoneOffsetMilliseconds(
  date:
    Date,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          LOOKUP_EVENT_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      },
    ).formatToParts(
      date,
    );

  const asUtc =
    Date.UTC(
      getNumericPart(
        parts,
        "year",
      ),

      getNumericPart(
        parts,
        "month",
      ) - 1,

      getNumericPart(
        parts,
        "day",
      ),

      getNumericPart(
        parts,
        "hour",
      ),

      getNumericPart(
        parts,
        "minute",
      ),

      getNumericPart(
        parts,
        "second",
      ),
    );

  const roundedTimestamp =
    Math.floor(
      date.getTime() /
      1000,
    ) *
    1000;

  return (
    asUtc -
    roundedTimestamp
  );
}

function localMidnightToUtc(
  date:
    LocalCalendarDate,
) {
  const utcGuess =
    Date.UTC(
      date.year,
      date.month - 1,
      date.day,
      0,
      0,
      0,
    );

  let offset =
    getTimeZoneOffsetMilliseconds(
      new Date(
        utcGuess,
      ),
    );

  let resolved =
    utcGuess -
    offset;

  const correctedOffset =
    getTimeZoneOffsetMilliseconds(
      new Date(
        resolved,
      ),
    );

  if (
    correctedOffset !==
    offset
  ) {
    offset =
      correctedOffset;

    resolved =
      utcGuess -
      offset;
  }

  return new Date(
    resolved,
  );
}

function addLocalDays(
  date:
    LocalCalendarDate,

  days:
    number,
): LocalCalendarDate {
  const temporary =
    new Date(
      Date.UTC(
        date.year,
        date.month - 1,
        date.day +
        days,
      ),
    );

  return {
    year:
      temporary.getUTCFullYear(),

    month:
      temporary.getUTCMonth() +
      1,

    day:
      temporary.getUTCDate(),
  };
}

function getFirstDayOfNextMonth(
  date:
    LocalCalendarDate,
): LocalCalendarDate {
  const temporary =
    new Date(
      Date.UTC(
        date.year,
        date.month,
        1,
      ),
    );

  return {
    year:
      temporary.getUTCFullYear(),

    month:
      temporary.getUTCMonth() +
      1,

    day:
      1,
  };
}

function getLocalWeekday(
  date:
    LocalCalendarDate,
) {
  return new Date(
    Date.UTC(
      date.year,
      date.month - 1,
      date.day,
    ),
  ).getUTCDay();
}

function parseIsoCalendarDate(
  value:
    string | null | undefined,
): LocalCalendarDate | null {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const [
    yearValue,
    monthValue,
    dayValue,
  ] =
    value.split(
      "-",
    );

  const year =
    Number(
      yearValue,
    );

  const month =
    Number(
      monthValue,
    );

  const day =
    Number(
      dayValue,
    );

  if (
    !Number.isInteger(
      year,
    ) ||
    !Number.isInteger(
      month,
    ) ||
    !Number.isInteger(
      day,
    )
  ) {
    return null;
  }

  const verification =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    verification.getUTCFullYear() !==
    year ||
    verification.getUTCMonth() +
    1 !==
    month ||
    verification.getUTCDate() !==
    day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

function laterDate(
  first:
    Date,

  second:
    Date,
) {
  return first.getTime() >=
    second.getTime()
    ? first
    : second;
}

export function getEventDiscoveryDateRange({
  scope,
  dateFrom = null,
  dateTo = null,
  now = new Date(),
}: GetEventDiscoveryDateRangeInput): EventDiscoveryDateRange {
  const localToday =
    getLocalCalendarDate(
      now,
    );

  /*
   * Todos los modos excluyen eventos
   * que ya terminaron.
   */
  if (
    scope ===
    "all"
  ) {
    return {
      fromIso:
        now.toISOString(),

      toIso:
        null,
    };
  }

  if (
    scope ===
    "today"
  ) {
    const tomorrow =
      localMidnightToUtc(
        addLocalDays(
          localToday,
          1,
        ),
      );

    return {
      fromIso:
        now.toISOString(),

      toIso:
        tomorrow.toISOString(),
    };
  }

  if (
    scope ===
    "week"
  ) {
    const weekday =
      getLocalWeekday(
        localToday,
      );

    /*
     * 0 domingo
     * 1 lunes
     * ...
     * 6 sábado
     *
     * "Esta semana" termina al comenzar
     * el siguiente lunes.
     */
    const daysUntilMonday =
      weekday ===
        1
        ? 7
        : (
          8 -
          weekday
        ) %
        7;

    const nextMonday =
      localMidnightToUtc(
        addLocalDays(
          localToday,
          daysUntilMonday,
        ),
      );

    return {
      fromIso:
        now.toISOString(),

      toIso:
        nextMonday.toISOString(),
    };
  }

  if (
    scope ===
    "weekend"
  ) {
    const weekday =
      getLocalWeekday(
        localToday,
      );

    /*
     * Si ya estamos en fin de semana,
     * empieza ahora.
     *
     * Si todavía no ha llegado,
     * empieza el sábado a las 00:00.
     */
    if (
      weekday ===
      6
    ) {
      return {
        fromIso:
          now.toISOString(),

        toIso:
          localMidnightToUtc(
            addLocalDays(
              localToday,
              2,
            ),
          ).toISOString(),
      };
    }

    if (
      weekday ===
      0
    ) {
      return {
        fromIso:
          now.toISOString(),

        toIso:
          localMidnightToUtc(
            addLocalDays(
              localToday,
              1,
            ),
          ).toISOString(),
      };
    }

    const daysUntilSaturday =
      6 -
      weekday;

    const saturday =
      addLocalDays(
        localToday,
        daysUntilSaturday,
      );

    const monday =
      addLocalDays(
        saturday,
        2,
      );

    return {
      fromIso:
        localMidnightToUtc(
          saturday,
        ).toISOString(),

      toIso:
        localMidnightToUtc(
          monday,
        ).toISOString(),
    };
  }

  if (
    scope ===
    "month"
  ) {
    return {
      fromIso:
        now.toISOString(),

      toIso:
        localMidnightToUtc(
          getFirstDayOfNextMonth(
            localToday,
          ),
        ).toISOString(),
    };
  }

  /*
   * CUSTOM
   *
   * Todavía no existe UI para este modo,
   * pero respetamos la estructura de BD para
   * no romper preferencias futuras o existentes.
   */

  const customFrom =
    parseIsoCalendarDate(
      dateFrom,
    );

  const customTo =
    parseIsoCalendarDate(
      dateTo,
    );

  const from =
    customFrom
      ? laterDate(
        now,
        localMidnightToUtc(
          customFrom,
        ),
      )
      : now;

  const to =
    customTo
      ? localMidnightToUtc(
        addLocalDays(
          customTo,
          1,
        ),
      )
      : null;

  return {
    fromIso:
      from.toISOString(),

    toIso:
      to?.toISOString() ??
      null,
  };
}