import type { PackageSummary } from "../../services/npmRegistry/types";

export type SearchSort = "relevance" | "name" | "recent";

function publicationTime(value: string | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

export function parseSearchSort(value: string | null): SearchSort {
  if (value === "name" || value === "recent") return value;
  return "relevance";
}

export function filterAndSortPackages(
  items: PackageSummary[],
  keyword: string,
  sort: SearchSort,
): PackageSummary[] {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  const filtered = normalizedKeyword
    ? items.filter((item) =>
        item.keywords.some(
          (itemKeyword) => itemKeyword.toLocaleLowerCase() === normalizedKeyword,
        ),
      )
    : items;

  if (sort === "relevance") return filtered;

  return [...filtered].sort((left, right) => {
    if (sort === "name") {
      return left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
    }

    const leftDate = publicationTime(left.publishedAt);
    const rightDate = publicationTime(right.publishedAt);
    if (leftDate !== rightDate) return rightDate - leftDate;
    return left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });
  });
}

export function formatPublicationDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
