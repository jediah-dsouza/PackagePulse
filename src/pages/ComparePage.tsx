import { useState } from "react";
import { GitCompareArrows, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ComparePackagePicker } from "../features/comparison/ComparePackagePicker";
import { useCompareSelection } from "../features/comparison/useCompareSelection";
import { ComparisonTable } from "../features/comparison/ComparisonTable";
import { usePageTitle } from "../utils/usePageTitle";

export function ComparePage() {
  usePageTitle("Compare packages");
  const {
    selectedNames,
    selectedCount,
    removePackage,
    clearComparison,
    storageAvailable,
    storageRecovered,
    maxPackages,
  } = useCompareSelection();
  const [packageRetries, setPackageRetries] = useState<Record<string, number>>({});
  const [dependencyRetries, setDependencyRetries] = useState<Record<string, number>>(
    {},
  );

  function retryPackage(name: string) {
    setPackageRetries((current) => ({
      ...current,
      [name]: (current[name] ?? 0) + 1,
    }));
  }

  function retryDependencies(name: string) {
    setDependencyRetries((current) => ({
      ...current,
      [name]: (current[name] ?? 0) + 1,
    }));
  }

  return (
    <div className="page-container route-page compare-page">
      <header className="page-heading compare-page__heading">
        <div>
          <p className="eyebrow">Package decision workspace</p>
          <h1>Compare packages</h1>
          <p>Review returned npm metadata side by side. No package is ranked.</p>
        </div>
        {selectedCount > 0 && (
          <button
            className="button button--secondary"
            type="button"
            onClick={clearComparison}
          >
            <Trash2 aria-hidden="true" size={15} />
            Clear comparison
          </button>
        )}
      </header>

      {!storageAvailable && (
        <p className="comparison-storage-note" role="status">
          Browser storage is unavailable. Comparison selection works for this session
          but may not remain after refresh.
        </p>
      )}
      {storageRecovered && (
        <p className="comparison-storage-note" role="status">
          Invalid saved comparison entries were ignored. You can continue with the
          remaining packages.
        </p>
      )}

      {selectedCount < 2 ? (
        <section
          className="comparison-empty-state"
          aria-labelledby="comparison-empty-title"
        >
          <div className="comparison-empty-state__icon">
            <GitCompareArrows aria-hidden="true" size={20} />
          </div>
          <h2 id="comparison-empty-title">
            {selectedCount === 0
              ? "Choose packages to compare"
              : "Add one more package"}
          </h2>
          <p>
            {selectedCount === 0
              ? "Add up to three packages from Explore or search for them here. Comparison needs at least two packages."
              : `${selectedNames[0]} is selected. Add one more package to see a side-by-side metadata table.`}
          </p>
          {selectedCount === 0 ? (
            <Link className="text-link" to="/explore">
              Browse packages in Explore
            </Link>
          ) : (
            <ul className="comparison-selected-list">
              {selectedNames.map((name) => (
                <li key={name}>
                  <code>{name}</code>
                  <button
                    className="text-button"
                    type="button"
                    aria-label={`Remove ${name} from comparison`}
                    onClick={() => removePackage(name)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <ComparisonTable
          packageNames={selectedNames}
          onRemove={removePackage}
          onRetryPackage={retryPackage}
          onRetryDependencies={retryDependencies}
          packageRetries={packageRetries}
          dependencyRetries={dependencyRetries}
        />
      )}

      {selectedCount >= maxPackages && (
        <p className="comparison-limit-note">
          Three packages are selected, the comparison limit. Remove one before adding
          another.
        </p>
      )}
      <ComparePackagePicker />
    </div>
  );
}
