import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { isValidNpmPackageName } from "../../services/npmRegistry/npmRegistryService";
import {
  MAX_COMPARE_PACKAGES,
  readComparisonSelection,
  writeComparisonSelection,
} from "./comparisonStorage";
import {
  CompareSelectionContext,
  type AddComparisonResult,
  type CompareSelectionValue,
} from "./compareSelectionContext";

export function CompareSelectionProvider({ children }: { children: ReactNode }) {
  const [initialSelection] = useState(readComparisonSelection);
  const [selectedNames, setSelectedNames] = useState(initialSelection.names);
  const [storageAvailable, setStorageAvailable] = useState(initialSelection.available);

  useEffect(() => {
    setStorageAvailable(writeComparisonSelection(selectedNames));
  }, [selectedNames]);

  const isSelected = useCallback(
    (packageName: string) =>
      selectedNames.some(
        (selectedName) => selectedName.toLowerCase() === packageName.toLowerCase(),
      ),
    [selectedNames],
  );

  const addPackage = useCallback(
    (packageName: string): AddComparisonResult => {
      if (!isValidNpmPackageName(packageName)) return "invalid-name";
      if (
        selectedNames.some(
          (selectedName) => selectedName.toLowerCase() === packageName.toLowerCase(),
        )
      ) {
        return "already-selected";
      }
      if (selectedNames.length >= MAX_COMPARE_PACKAGES) return "limit-reached";
      setSelectedNames((current) => [...current, packageName]);
      return "added";
    },
    [selectedNames],
  );

  const removePackage = useCallback((packageName: string) => {
    setSelectedNames((current) =>
      current.filter(
        (selectedName) => selectedName.toLowerCase() !== packageName.toLowerCase(),
      ),
    );
  }, []);

  const clearComparison = useCallback(() => setSelectedNames([]), []);

  const value = useMemo<CompareSelectionValue>(
    () => ({
      selectedNames,
      selectedCount: selectedNames.length,
      isSelected,
      addPackage,
      removePackage,
      clearComparison,
      storageAvailable,
      storageRecovered: initialSelection.recovered,
      maxPackages: MAX_COMPARE_PACKAGES,
    }),
    [
      selectedNames,
      isSelected,
      addPackage,
      removePackage,
      clearComparison,
      storageAvailable,
      initialSelection.recovered,
    ],
  );

  return (
    <CompareSelectionContext.Provider value={value}>
      {children}
    </CompareSelectionContext.Provider>
  );
}
