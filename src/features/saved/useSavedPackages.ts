import { useContext } from "react";
import { SavedPackagesContext, type SavedPackagesValue } from "./savedPackagesContext";

export function useSavedPackages(): SavedPackagesValue {
  const value = useContext(SavedPackagesContext);
  if (!value) {
    throw new Error("useSavedPackages must be used within SavedPackagesProvider.");
  }
  return value;
}
