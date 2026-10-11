import { useEffect, useRef, useState } from "react";
import { Bookmark, ExternalLink, Package as PackageIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSavedPackages } from "../features/saved/useSavedPackages";
import { getNpmPackageDetails } from "../services/npmRegistry/npmRegistryService";
import { NpmRegistryError, type PackageDetails } from "../services/npmRegistry/types";
import { usePageTitle } from "../utils/usePageTitle";

type DetailState =
  | { status: "loading" }
  | { status: "success"; details: PackageDetails }
  | { status: "error"; message: string; retryable: boolean };

function publicationDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function detailErrorMessage(error: unknown): { message: string; retryable: boolean } {
  if (error instanceof NpmRegistryError) {
    if (error.code === "not-found") {
      return {
        message:
          "The npm Registry could not find this package. It remains saved, and you can still open its detail route.",
        retryable: false,
      };
    }
    if (error.code === "rate-limited") {
      return {
        message: "The npm Registry is limiting requests. Wait briefly, then retry.",
        retryable: true,
      };
    }
    if (error.code === "network") {
      return {
        message: "Could not reach the npm Registry. Check your connection and retry.",
        retryable: true,
      };
    }
  }
  return {
    message:
      "Package metadata could not be loaded from the npm Registry. Retry shortly.",
    retryable: true,
  };
}

function SavedPackageCard({
  packageName,
  onRemove,
}: {
  packageName: string;
  onRemove: (packageName: string) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    void getNpmPackageDetails(packageName, { signal: controller.signal })
      .then((details) => {
        setState({ status: "success", details });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", ...detailErrorMessage(error) });
      });

    return () => controller.abort();
  }, [packageName, attempt]);

  return (
    <li className="saved-package-card">
      <div className="saved-package-card__main">
        <h2>
          <Link to={`/package/${encodeURIComponent(packageName)}`}>{packageName}</Link>
        </h2>
        {state.status === "loading" ? (
          <div
            className="saved-package-card__loading"
            role="status"
            aria-label={`Loading metadata for ${packageName}`}
          >
            <span className="saved-package-card__skeleton" />
            <span className="saved-package-card__skeleton saved-package-card__skeleton--short" />
            <span className="visually-hidden">
              Loading package metadata for {packageName}.
            </span>
          </div>
        ) : state.status === "success" ? (
          <>
            <p>
              {state.details.description || "No description provided by the registry."}
            </p>
            {state.details.descriptionTruncated && (
              <p className="package-data-note">
                Description shortened to a safe display length.
              </p>
            )}
            <dl className="saved-package-card__facts">
              {state.details.latestVersion && (
                <div>
                  <dt>Latest version</dt>
                  <dd>
                    <code>{state.details.latestVersion}</code>
                  </dd>
                </div>
              )}
              {state.details.license && (
                <div>
                  <dt>License</dt>
                  <dd>{state.details.license}</dd>
                </div>
              )}
              {publicationDate(state.details.publishedAt) &&
                state.details.publishedAt && (
                  <div>
                    <dt>Last published</dt>
                    <dd>
                      <time dateTime={state.details.publishedAt}>
                        {publicationDate(state.details.publishedAt)}
                      </time>
                    </dd>
                  </div>
                )}
            </dl>
          </>
        ) : (
          <div
            className="saved-package-card__error"
            role="group"
            aria-label="Metadata status"
          >
            <p role="status">{state.message}</p>
            {state.retryable && (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setAttempt((current) => current + 1)}
              >
                Retry metadata
              </button>
            )}
          </div>
        )}
        {state.status === "success" && state.details.npmUrl && (
          <a
            className="text-link saved-package-card__npm"
            href={state.details.npmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden="true" size={15} />
            Open npm page (new tab)
          </a>
        )}
        {state.status === "error" && (
          <Link
            className="text-link"
            to={`/package/${encodeURIComponent(packageName)}`}
          >
            <PackageIcon aria-hidden="true" size={15} />
            Open package details
          </Link>
        )}
      </div>
      <button
        className="button button--secondary saved-package-card__remove"
        type="button"
        aria-label={`Remove ${packageName} from saved packages`}
        data-remove-saved
        onClick={() => onRemove(packageName)}
      >
        <Trash2 aria-hidden="true" size={16} />
        Remove
      </button>
    </li>
  );
}

export function SavedPage() {
  usePageTitle("Saved packages");
  const {
    savedNames,
    savedCount,
    storageAvailable,
    storageRecovered,
    removeSavedPackage,
    announce,
  } = useSavedPackages();
  const listRef = useRef<HTMLOListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const removedNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const removedName = removedNameRef.current;
    if (!removedName || savedNames.includes(removedName)) return;
    const frame = window.requestAnimationFrame(() => {
      const nextRemoveButton =
        listRef.current?.querySelector<HTMLButtonElement>("[data-remove-saved]");
      (nextRemoveButton ?? headingRef.current)?.focus();
      removedNameRef.current = undefined;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [savedNames]);

  function removePackage(packageName: string) {
    removedNameRef.current = packageName;
    const result = removeSavedPackage(packageName);
    announce(
      result === "removed-session"
        ? `${packageName} removed for this session. Browser storage is unavailable.`
        : `${packageName} removed from saved packages.`,
    );
  }

  return (
    <div className="page-container route-page saved-page">
      <header className="page-heading">
        <h1 ref={headingRef} tabIndex={-1}>
          Saved packages
        </h1>
        <p>
          {savedCount === 0
            ? "Keep a short list of packages to revisit in this browser."
            : `${savedCount} saved package${savedCount === 1 ? "" : "s"} in this browser.`}
        </p>
      </header>

      {!storageAvailable && (
        <div
          className="saved-storage-notice saved-storage-notice--warning"
          role="status"
        >
          <Bookmark aria-hidden="true" size={17} />
          <div>
            <h2>Browser storage is unavailable</h2>
            <p>
              Changes remain available for this session, but saved packages may not
              survive a refresh. Check your browser storage settings.
            </p>
          </div>
        </div>
      )}
      {storageRecovered && (
        <div className="saved-storage-notice" role="status">
          <Bookmark aria-hidden="true" size={17} />
          <div>
            <h2>Saved list recovered</h2>
            <p>
              Invalid or duplicate stored entries were removed. Valid package names
              remain in your list.
            </p>
          </div>
        </div>
      )}

      {savedNames.length === 0 ? (
        <section className="saved-empty-state" aria-labelledby="saved-empty-title">
          <div className="saved-empty-state__mark">
            <Bookmark aria-hidden="true" size={22} strokeWidth={1.8} />
          </div>
          <h2 id="saved-empty-title">A place for your shortlist</h2>
          <p>
            Save package names from Explore or a package record to revisit them here.
            Your list is stored only in this browser.
          </p>
          <Link className="text-link" to="/explore">
            <ExternalLink aria-hidden="true" size={15} />
            Explore packages
          </Link>
        </section>
      ) : (
        <section aria-labelledby="saved-list-heading" className="saved-list-section">
          <div className="saved-list-heading">
            <h2 id="saved-list-heading">Your saved packages</h2>
            <p>
              Registry metadata is shown when it is available; saves are not
              endorsements.
            </p>
          </div>
          <ol className="saved-package-list" ref={listRef}>
            {savedNames.map((packageName) => (
              <SavedPackageCard
                key={packageName.toLocaleLowerCase()}
                packageName={packageName}
                onRemove={removePackage}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
