import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readSavedPackages,
  SAVED_PACKAGES_STORAGE_KEY,
  sanitizeSavedPackageNames,
  writeSavedPackages,
} from "./savedStorage";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("saved package storage", () => {
  it("persists only unique valid identifiers, including scoped names", () => {
    expect(writeSavedPackages(["react", "@types/node", "react", "not valid"])).toBe(
      true,
    );
    expect(window.localStorage.getItem(SAVED_PACKAGES_STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, names: ["react", "@types/node"] }),
    );
    expect(readSavedPackages()).toEqual({
      names: ["react", "@types/node"],
      available: true,
      recovered: false,
    });
  });

  it("sanitizes invalid, duplicate, and case-insensitive duplicates", () => {
    expect(
      sanitizeSavedPackageNames([
        "react",
        "REACT",
        "@types/node",
        "",
        { name: "unsafe" },
      ]),
    ).toEqual({
      names: ["react", "@types/node"],
      recovered: true,
    });
  });

  it("returns an empty recoverable snapshot for malformed JSON or schema", () => {
    window.localStorage.setItem(SAVED_PACKAGES_STORAGE_KEY, "{");
    expect(readSavedPackages()).toEqual({
      names: [],
      available: true,
      recovered: true,
    });

    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 2, names: ["react"] }),
    );
    expect(readSavedPackages()).toEqual({
      names: [],
      available: true,
      recovered: true,
    });

    window.localStorage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: 1, names: ["react", "react", "bad name"] }),
    );
    expect(readSavedPackages()).toEqual({
      names: ["react"],
      available: true,
      recovered: true,
    });
  });

  it("recovers gracefully when browser storage reads are blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    expect(readSavedPackages()).toEqual({
      names: [],
      available: false,
      recovered: false,
    });
  });

  it("returns false when storage writes are blocked or over quota", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(writeSavedPackages(["react"])).toBe(false);
  });
});
