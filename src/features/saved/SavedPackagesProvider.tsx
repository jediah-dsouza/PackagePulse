import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { isValidNpmPackageName } from "../../services/npmRegistry/npmRegistryService";
import {
  readSavedPackages,
  SAVED_PACKAGES_STORAGE_KEY,
  sanitizeSavedPackageNames,
  writeSavedPackages,
} from "./savedStorage";
import { SavedPackagesContext, type SavedPackagesValue } from "./savedPackagesContext";

export function SavedPackagesProvider({ children }: { children: ReactNode }) {
  const [initialSnapshot] = useState(readSavedPackages);
  const [savedNames, setSavedNames] = useState(initialSnapshot.names);
  const savedNamesRef = useRef(initialSnapshot.names);
  const [storageAvailable, setStorageAvailable] = useState(initialSnapshot.available);
  const [announcement, setAnnouncement] = useState("");

  const commitNames = useCallback((names: string[]) => {
    const normalized = sanitizeSavedPackageNames(names).names;
    savedNamesRef.current = normalized;
    setSavedNames(normalized);
    const persisted = writeSavedPackages(normalized);
    setStorageAvailable(persisted);
    return persisted;
  }, []);

  useEffect(() => {
    if (initialSnapshot.recovered && initialSnapshot.available) {
      setStorageAvailable(writeSavedPackages(initialSnapshot.names));
    }
  }, [initialSnapshot]);

  useEffect(() => {
    function syncFromStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== SAVED_PACKAGES_STORAGE_KEY) return;
      const snapshot = readSavedPackages();
      savedNamesRef.current = snapshot.names;
      setSavedNames(snapshot.names);
      setStorageAvailable(snapshot.available);
    }
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const isSaved = useCallback(
    (packageName: string) =>
      savedNames.some(
        (name) => name.toLocaleLowerCase() === packageName.toLocaleLowerCase(),
      ),
    [savedNames],
  );

  const toggleSavedPackage = useCallback(
    (packageName: string): ReturnType<SavedPackagesValue["toggleSavedPackage"]> => {
      if (!isValidNpmPackageName(packageName)) return "invalid-name";
      const current = savedNamesRef.current;
      const existing = current.some(
        (name) => name.toLocaleLowerCase() === packageName.toLocaleLowerCase(),
      );
      const next = existing
        ? current.filter(
            (name) => name.toLocaleLowerCase() !== packageName.toLocaleLowerCase(),
          )
        : [...current, packageName];
      const persisted = commitNames(next);
      if (existing) return persisted ? "removed" : "removed-session";
      return persisted ? "saved" : "saved-session";
    },
    [commitNames],
  );

  const removeSavedPackage = useCallback(
    (packageName: string) => {
      const current = savedNamesRef.current;
      const next = current.filter(
        (name) => name.toLocaleLowerCase() !== packageName.toLocaleLowerCase(),
      );
      if (next.length === current.length) return "not-saved";
      return commitNames(next) ? "removed" : "removed-session";
    },
    [commitNames],
  );

  const announce = useCallback((message: string) => setAnnouncement(message), []);
  const clearAnnouncement = useCallback(() => setAnnouncement(""), []);

  const value = useMemo<SavedPackagesValue>(
    () => ({
      savedNames,
      savedCount: savedNames.length,
      storageAvailable,
      storageRecovered: initialSnapshot.recovered,
      isSaved,
      toggleSavedPackage,
      removeSavedPackage,
      announcement,
      announce,
      clearAnnouncement,
    }),
    [
      savedNames,
      storageAvailable,
      initialSnapshot.recovered,
      isSaved,
      toggleSavedPackage,
      removeSavedPackage,
      announcement,
      announce,
      clearAnnouncement,
    ],
  );

  return (
    <SavedPackagesContext.Provider value={value}>
      {children}
    </SavedPackagesContext.Provider>
  );
}
