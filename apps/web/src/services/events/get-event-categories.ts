import {
  supabase,
} from "@lookup/services";

export type EventCategory = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

type EventCategoryRow = {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
};

function isEventCategoryRow(
  value: unknown,
): value is EventCategoryRow {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const row =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof row.slug ===
      "string" &&
    typeof row.name ===
      "string" &&
    typeof row.description ===
      "string" &&
    typeof row.sort_order ===
      "number"
  );
}

export async function getEventCategories(): Promise<
  EventCategory[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "event_categories",
      )
      .select(
        `
          slug,
          name,
          description,
          sort_order
        `,
      )
      .eq(
        "is_active",
        true,
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      "No se pudieron cargar las categorías de eventos.",
    );
  }

  return (data ?? [])
    .filter(
      isEventCategoryRow,
    )
    .map(
      (row) => ({
        slug:
          row.slug,

        name:
          row.name,

        description:
          row.description,

        sortOrder:
          row.sort_order,
      }),
    );
}