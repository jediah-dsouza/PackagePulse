import { GitCompareArrows, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCompareSelection } from "./useCompareSelection";

export function ComparisonTray() {
  const {
    selectedNames,
    removePackage,
    maxPackages,
    storageAvailable,
    storageRecovered,
  } = useCompareSelection();
  const location = useLocation();

  if (selectedNames.length === 0 || location.pathname === "/compare") return null;

  return (
    <aside className="comparison-tray" aria-label="Comparison selection">
      <div className="comparison-tray__inner page-container">
        <div className="comparison-tray__summary">
          <GitCompareArrows aria-hidden="true" size={17} />
          <span>
            {selectedNames.length} of {maxPackages} packages selected
          </span>
          <span className="visually-hidden" role="status" aria-live="polite">
            {selectedNames.length} package
            {selectedNames.length === 1 ? "" : "s"} selected for comparison.
          </span>
        </div>
        <ul className="comparison-tray__items">
          {selectedNames.map((name) => (
            <li key={name}>
              <code>{name}</code>
              <button
                className="comparison-tray__remove"
                type="button"
                aria-label={`Remove ${name} from comparison`}
                onClick={() => removePackage(name)}
              >
                <X aria-hidden="true" size={14} />
              </button>
            </li>
          ))}
        </ul>
        <Link className="button button--primary comparison-tray__action" to="/compare">
          Review comparison
        </Link>
        {selectedNames.length === maxPackages && (
          <p className="comparison-tray__limit">
            Remove a package before adding another.
          </p>
        )}
        {!storageAvailable && (
          <p className="comparison-tray__storage-note">
            Comparison works for this session; browser storage is unavailable.
          </p>
        )}
        {storageRecovered && (
          <p className="comparison-tray__storage-note">
            Invalid saved comparison entries were ignored.
          </p>
        )}
      </div>
    </aside>
  );
}
