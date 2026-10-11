import { isValidNpmPackageName } from "../../services/npmRegistry/npmRegistryService";

export const SAVED_PACKAGES_STORAGE_KEY = "packagepulse:saved:v1";
const SAVED_PACKAGES_VERSION = 1;

export type SavedPackagesSnapshot = {
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

export function sanitizeSavedPackageNames(value: unknown): {
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

    const normalized = candidate.toLocaleLowerCase();
    if (seen.has(normalized)) {
      recovered = true;
      continue;
    }

    seen.add(normalized);
    names.push(candidate);
  }

  return { names, recovered };
}

export function readSavedPackages(): SavedPackagesSnapshot {
  const storage = currentStorage();
  if (!storage) return { names: [], available: false, recovered: false };

  try {
    const serialized = storage.getItem(SAVED_PACKAGES_STORAGE_KEY);
    if (serialized === null) return { names: [], available: true, recovered: false };

    try {
      const parsed: unknown = JSON.parse(serialized);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("version" in parsed) ||
        !("names" in parsed) ||
        parsed.version !== SAVED_PACKAGES_VERSION
      ) {
        return { names: [], available: true, recovered: true };
      }

      const normalized = sanitizeSavedPackageNames(parsed.names);
      return { ...normalized, available: true };
    } catch {
      return { names: [], available: true, recovered: true };
    }
  } catch {
    return { names: [], available: false, recovered: false };
  }
}

export function writeSavedPackages(names: string[]): boolean {
  const storage = currentStorage();
  if (!storage) return false;

  try {
    const normalized = sanitizeSavedPackageNames(names);
    storage.setItem(
      SAVED_PACKAGES_STORAGE_KEY,
      JSON.stringify({ version: SAVED_PACKAGES_VERSION, names: normalized.names }),
    );
    return true;
  } catch {
    return false;
  }
}
