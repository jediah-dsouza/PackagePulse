import { isValidNpmPackageName } from "../../services/npmRegistry/npmRegistryService";

export const COMPARISON_STORAGE_KEY = "packagepulse:compare:v1";
export const MAX_COMPARE_PACKAGES = 3;

export type ComparisonStorageSnapshot = {
  names: string[];
  available: boolean;
  recovered: boolean;
};

function currentStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function sanitizeComparisonNames(value: unknown): {
  names: string[];
  recovered: boolean;
} {
  if (!Array.isArray(value)) return { names: [], recovered: true };

  const names: string[] = [];
  const seen = new Set<string>();
  let recovered = false;

  for (const candidate of value) {
    if (typeof candidate !== "string" || !isValidNpmPackageName(candidate)) {
      recovered = true;
      continue;
    }
    const normalized = candidate.toLowerCase();
    if (seen.has(normalized)) {
      recovered = true;
      continue;
    }
    if (names.length >= MAX_COMPARE_PACKAGES) {
      recovered = true;
      continue;
    }
    seen.add(normalized);
    names.push(candidate);
  }

  return { names, recovered };
}

export function readComparisonSelection(): ComparisonStorageSnapshot {
  const storage = currentStorage();
  if (!storage) return { names: [], available: false, recovered: false };

  try {
    const serialized = storage.getItem(COMPARISON_STORAGE_KEY);
    if (serialized === null) return { names: [], available: true, recovered: false };

    try {
      const parsed: unknown = JSON.parse(serialized);
      const normalized = sanitizeComparisonNames(parsed);
      return { ...normalized, available: true };
    } catch {
      return { names: [], available: true, recovered: true };
    }
  } catch {
    return { names: [], available: false, recovered: false };
  }
}

export function writeComparisonSelection(names: string[]): boolean {
  const storage = currentStorage();
  if (!storage) return false;

  try {
    const normalized = sanitizeComparisonNames(names);
    storage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(normalized.names));
    return true;
  } catch {
    return false;
  }
}
