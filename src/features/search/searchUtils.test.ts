import { describe, expect, it } from "vitest";
import {
  filterAndSortPackages,
  formatPublicationDate,
  parseSearchSort,
} from "./searchUtils";
import type { PackageSummary } from "../../services/npmRegistry/types";

const packages: PackageSummary[] = [
  {
    name: "zeta",
    keywords: ["ui", "react"],
    publishedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    name: "alpha",
    keywords: ["router"],
    publishedAt: "2026-01-01T00:00:00.000Z",
  },
  { name: "beta", keywords: ["ui"] },
];

describe("search result filtering and sorting", () => {
  it("filters by exact case-insensitive returned keywords", () => {
    expect(
      filterAndSortPackages(packages, "UI", "relevance").map((item) => item.name),
    ).toEqual(["zeta", "beta"]);
    expect(filterAndSortPackages(packages, "ui-kit", "relevance")).toEqual([]);
  });

  it("sorts loaded results by package name without mutating input", () => {
    const result = filterAndSortPackages(packages, "", "name");
    expect(result.map((item) => item.name)).toEqual(["alpha", "beta", "zeta"]);
    expect(packages.map((item) => item.name)).toEqual(["zeta", "alpha", "beta"]);
  });

  it("sorts by publication date and keeps missing dates last", () => {
    expect(
      filterAndSortPackages(packages, "", "recent").map((item) => item.name),
    ).toEqual(["alpha", "zeta", "beta"]);
  });

  it("normalizes invalid sort values and formats valid dates", () => {
    expect(parseSearchSort("unsupported")).toBe("relevance");
    expect(parseSearchSort("recent")).toBe("recent");
    expect(formatPublicationDate("2026-09-09T17:21:30.071Z")).toBeTruthy();
    expect(formatPublicationDate("invalid")).toBeUndefined();
    expect(formatPublicationDate(undefined)).toBeUndefined();
  });
});
