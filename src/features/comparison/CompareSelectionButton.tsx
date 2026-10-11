import { GitCompareArrows, X } from "lucide-react";
import { useState } from "react";
import { useCompareSelection } from "./useCompareSelection";

export function CompareSelectionButton({
  packageName,
  className = "",
}: {
  packageName: string;
  className?: string;
}) {
  const { addPackage, isSelected, maxPackages, removePackage, selectedCount } =
    useCompareSelection();
  const [message, setMessage] = useState("");
  const selected = isSelected(packageName);
  const limitReached = !selected && selectedCount >= maxPackages;

  function toggleSelection() {
    if (selected) {
      removePackage(packageName);
      setMessage(`${packageName} removed from comparison.`);
      return;
    }

    const result = addPackage(packageName);
    setMessage(
      result === "added"
        ? `${packageName} added to comparison.`
        : result === "already-selected"
          ? `${packageName} is already selected.`
          : result === "limit-reached"
            ? `Comparison is limited to ${maxPackages} packages. Remove one before adding another.`
            : "This package name cannot be added to comparison.",
    );
  }

  return (
    <>
      <button
        className={`button button--secondary compare-selection-button ${className}`.trim()}
        type="button"
        aria-label={
          limitReached
            ? `Comparison limit reached; cannot add ${packageName}`
            : `${selected ? "Remove" : "Add"} ${packageName} ${selected ? "from" : "to"} comparison`
        }
        aria-pressed={selected}
        disabled={limitReached}
        onClick={toggleSelection}
      >
        {selected ? (
          <X aria-hidden="true" size={15} />
        ) : (
          <GitCompareArrows aria-hidden="true" size={15} />
        )}
        {limitReached
          ? "Limit reached"
          : selected
            ? "Remove from compare"
            : "Add to compare"}
      </button>
      {message && (
        <span className="visually-hidden" role="status" aria-live="polite">
          {message}
        </span>
      )}
    </>
  );
}
