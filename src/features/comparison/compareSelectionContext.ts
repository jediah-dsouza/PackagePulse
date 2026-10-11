import { createContext } from "react";

export type AddComparisonResult =
  "added" | "already-selected" | "limit-reached" | "invalid-name";

export type CompareSelectionValue = {
  selectedNames: string[];
  selectedCount: number;
  isSelected: (packageName: string) => boolean;
  addPackage: (packageName: string) => AddComparisonResult;
  removePackage: (packageName: string) => void;
  clearComparison: () => void;
  storageAvailable: boolean;
  storageRecovered: boolean;
  maxPackages: number;
};

export const CompareSelectionContext = createContext<CompareSelectionValue | null>(
  null,
);
