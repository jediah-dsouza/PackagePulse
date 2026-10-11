import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMPARISON_STORAGE_KEY,
  MAX_COMPARE_PACKAGES,
  readComparisonSelection,
  sanitizeComparisonNames,
  writeComparisonSelection,
} from "./comparisonStorage";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("comparison selection storage", () => {
  it("validates names, removes duplicates and enforces the three-package cap", () => {
    expect(
      sanitizeComparisonNames([
        "react",
        "react",
        "@types/node",
        "vite",
        "lodash",
        "Bad_Name",
        12,
      ]),
    ).toEqual({
      names: ["react", "@types/node", "vite"],
      recovered: true,
    });
    expect(MAX_COMPARE_PACKAGES).toBe(3);
  });

  it("persists only small package identifiers and restores them", () => {
    expect(writeComparisonSelection(["react", "@types/node"])).toBe(true);
    expect(window.localStorage.getItem(COMPARISON_STORAGE_KEY)).toBe(
      JSON.stringify(["react", "@types/node"]),
    );
    expect(readComparisonSelection()).toEqual({
      names: ["react", "@types/node"],
      available: true,
      recovered: false,
    });
  });

  it("recovers malformed stored JSON without throwing", () => {
    window.localStorage.setItem(COMPARISON_STORAGE_KEY, "{");

    expect(readComparisonSelection()).toEqual({
      names: [],
      available: true,
      recovered: true,
    });
  });

  it("continues in memory when browser storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage access denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage access denied", "SecurityError");
    });

    expect(readComparisonSelection()).toEqual({
      names: [],
      available: false,
      recovered: false,
    });
    expect(writeComparisonSelection(["react"])).toBe(false);
  });
});
