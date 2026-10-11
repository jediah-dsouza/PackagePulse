import { useContext } from "react";
import {
  CompareSelectionContext,
  type CompareSelectionValue,
} from "./compareSelectionContext";

export function useCompareSelection(): CompareSelectionValue {
  const value = useContext(CompareSelectionContext);
  if (!value) {
    throw new Error(
      "useCompareSelection must be used within CompareSelectionProvider.",
    );
  }
  return value;
}
