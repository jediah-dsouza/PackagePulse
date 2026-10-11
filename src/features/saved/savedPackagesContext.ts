import { createContext } from "react";

export type SavedPackageChangeResult =
  "saved" | "saved-session" | "removed" | "removed-session" | "already-saved";

export type SavedPackagesValue = {
  savedNames: string[];
  savedCount: number;
  storageAvailable: boolean;
  storageRecovered: boolean;
  isSaved: (packageName: string) => boolean;
  toggleSavedPackage: (
    packageName: string,
  ) => SavedPackageChangeResult | "invalid-name";
  removeSavedPackage: (packageName: string) => SavedPackageChangeResult | "not-saved";
  announcement: string;
  announce: (message: string) => void;
  clearAnnouncement: () => void;
};

export const SavedPackagesContext = createContext<SavedPackagesValue | null>(null);
