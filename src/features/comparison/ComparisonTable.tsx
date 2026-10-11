import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, RotateCw, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getNpmPackageDetails,
  getNpmPackageVersionDetails,
} from "../../services/npmRegistry/npmRegistryService";
import {
  NpmRegistryError,
  type PackageDependencyGroup,
  type PackageDetails,
  type PackageVersionDetails,
} from "../../services/npmRegistry/types";

type DependencyState =
  | { status: "loading" }
  | { status: "not-returned" }
  | { status: "error"; error: NpmRegistryError }
  | { status: "success"; group: PackageDependencyGroup | undefined };

type ComparisonPackageState =
  | { status: "loading"; name: string }
  | { status: "error"; name: string; error: NpmRegistryError }
  | {
      status: "success";
      name: string;
      details: PackageDetails;
      dependencies: DependencyState;
    };

type StateChange = (name: string, state: ComparisonPackageState) => void;

function toRegistryError(error: unknown): NpmRegistryError {
  return error instanceof NpmRegistryError
    ? error
    : new NpmRegistryError("unknown", { cause: error });
}

function dependenciesFromVersion(
  version: PackageVersionDetails,
): PackageDependencyGroup | undefined {
  return version.dependencyGroups.find((group) => group.kind === "dependencies");
}

function ComparisonPackageLoader({
  name,
  packageRetry,
  dependencyRetry,
  onState,
}: {
  name: string;
  packageRetry: number;
  dependencyRetry: number;
  onState: StateChange;
}) {
  const [details, setDetails] = useState<PackageDetails | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setDetails(null);
    onState(name, { status: "loading", name });

    void getNpmPackageDetails(name, { signal: controller.signal })
      .then((packageDetails) => {
        if (!active || controller.signal.aborted) return;
        setDetails(packageDetails);
        if (packageDetails.latestVersionDetails) {
          onState(name, {
            status: "success",
            name,
            details: packageDetails,
            dependencies: {
              status: "success",
              group: dependenciesFromVersion(packageDetails.latestVersionDetails),
            },
          });
        } else {
          onState(name, {
            status: "success",
            name,
            details: packageDetails,
            dependencies: packageDetails.latestVersion
              ? { status: "loading" }
              : { status: "not-returned" },
          });
        }
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        const registryError = toRegistryError(error);
        if (registryError.code !== "aborted") {
          onState(name, { status: "error", name, error: registryError });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [name, packageRetry, onState]);

  useEffect(() => {
    if (!details || details.latestVersionDetails) return;
    if (!details.latestVersion) {
      onState(name, {
        status: "success",
        name,
        details,
        dependencies: { status: "not-returned" },
      });
      return;
    }

    const controller = new AbortController();
    let active = true;
    onState(name, {
      status: "success",
      name,
      details,
      dependencies: { status: "loading" },
    });

    void getNpmPackageVersionDetails(name, details.latestVersion, {
      signal: controller.signal,
    })
      .then((version) => {
        if (!active || controller.signal.aborted) return;
        onState(name, {
          status: "success",
          name,
          details,
          dependencies: {
            status: "success",
            group: dependenciesFromVersion(version),
          },
        });
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        const registryError = toRegistryError(error);
        if (registryError.code !== "aborted") {
          onState(name, {
            status: "success",
            name,
            details,
            dependencies: { status: "error", error: registryError },
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [details, dependencyRetry, name, onState]);

  return null;
}

function formatDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function packageErrorMessage(error: NpmRegistryError): string {
  if (error.code === "not-found") return "Package not found in the npm Registry.";
  if (error.code === "rate-limited") {
    return "The Registry is limiting this package request. Wait a little, then retry.";
  }
  if (error.code === "network") return "Couldn't reach the npm Registry.";
  if (error.code === "server") return "The npm Registry is temporarily unavailable.";
  return "Package metadata could not be loaded.";
}

function dependencyValue(state: DependencyState): string | undefined {
  if (state.status === "loading") return undefined;
  if (state.status === "not-returned") return "Not returned by the Registry";
  if (state.status === "error") return "Request failed";

  const group = state.group;
  if (!group || group.status === "unavailable") return "Dependency data unavailable";
  if (group.items.length === 0) return "0 dependencies listed";
  if (group.status === "partial") {
    return group.omittedByLimit
      ? `${group.items.length} dependencies shown; 2,000-entry limit reached`
      : `${group.items.length} valid dependencies; some entries were omitted`;
  }
  return `${group.items.length} dependencies listed`;
}

function rowValue(rowId: string, state: ComparisonPackageState): string | undefined {
  if (state.status !== "success") return undefined;
  const { details } = state;

  switch (rowId) {
    case "latest-version":
      return details.latestVersion || "Not provided";
    case "license":
      return details.license || "Not provided";
    case "last-published":
      return formatDate(details.publishedAt) ?? "Not provided";
    case "dependencies":
      return dependencyValue(state.dependencies);
    case "repository":
      return details.repositoryUrl || "Not provided";
    case "homepage":
      return details.homepageUrl || "Not provided";
    case "keywords":
      if (details.keywords.length === 0) {
        return details.keywordsTruncated
          ? "Keyword entries omitted by safety limits"
          : "Not provided";
      }
      return `${details.keywords.join(", ")}${details.keywordsTruncated ? " (keyword data may be incomplete)" : ""}`;
    default:
      return "Not provided";
  }
}

const COMPARISON_ROWS = [
  { id: "latest-version", label: "Latest version" },
  { id: "license", label: "License" },
  { id: "last-published", label: "Last published" },
  { id: "dependencies", label: "Dependencies" },
  { id: "repository", label: "Repository" },
  { id: "homepage", label: "Homepage" },
  { id: "keywords", label: "Package keywords" },
] as const;

function valuesDiffer(
  rowId: string,
  packageNames: string[],
  states: Record<string, ComparisonPackageState>,
): boolean {
  const values = packageNames
    .map((name) => states[name])
    .filter(
      (state): state is Extract<ComparisonPackageState, { status: "success" }> =>
        state?.status === "success",
    )
    .map((state) => rowValue(rowId, state))
    .filter((value): value is string => value !== undefined);
  return values.length > 1 && new Set(values).size > 1;
}

export function ComparisonTable({
  packageNames,
  onRemove,
  onRetryPackage,
  onRetryDependencies,
  packageRetries,
  dependencyRetries,
}: {
  packageNames: string[];
  onRemove: (name: string) => void;
  onRetryPackage: (name: string) => void;
  onRetryDependencies: (name: string) => void;
  packageRetries: Record<string, number>;
  dependencyRetries: Record<string, number>;
}) {
  const [states, setStates] = useState<Record<string, ComparisonPackageState>>({});
  const handleStateChange = useCallback<StateChange>(
    (name, state) => setStates((current) => ({ ...current, [name]: state })),
    [],
  );

  return (
    <section
      className="comparison-section comparison-section--live"
      aria-labelledby="comparison-heading"
    >
      <div className="section-heading section-heading--row">
        <div className="comparison-section__title">
          <h2 id="comparison-heading">Metadata comparison</h2>
        </div>
        <span>{packageNames.length} packages selected</span>
      </div>
      <p className="comparison-scroll-cue" id="comparison-scroll-help">
        On narrow screens, scroll within the table to keep each field with its package
        value. Weekly downloads are not requested and are not compared.
      </p>
      <div
        className="comparison-table-scroll"
        role="region"
        aria-label="Package comparison"
        aria-describedby="comparison-scroll-help"
        tabIndex={0}
      >
        <table className="comparison-table comparison-table--live">
          <caption className="visually-hidden">
            Available npm Registry metadata for the selected packages
          </caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              {packageNames.map((name) => {
                const state = states[name] ?? { status: "loading" as const, name };
                return (
                  <th scope="col" key={name}>
                    <div className="comparison-package-header">
                      <code>{name}</code>
                      <Link
                        className="text-link comparison-package-header__details"
                        to={`/package/${encodeURIComponent(name)}`}
                        aria-label={`Open details for ${name}`}
                      >
                        Open details
                      </Link>
                      <button
                        className="comparison-package-header__remove"
                        type="button"
                        aria-label={`Remove ${name} from comparison`}
                        onClick={() => onRemove(name)}
                      >
                        <X aria-hidden="true" size={15} />
                      </button>
                      {state.status === "loading" && (
                        <span
                          className="comparison-package-header__status"
                          role="status"
                          aria-live="polite"
                        >
                          Loading metadata…
                        </span>
                      )}
                      {state.status === "error" && (
                        <div className="comparison-package-header__error" role="alert">
                          <p>{packageErrorMessage(state.error)}</p>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => onRetryPackage(name)}
                          >
                            <RotateCw aria-hidden="true" size={14} />
                            Retry package
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => {
              const different = valuesDiffer(row.id, packageNames, states);
              return (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  {packageNames.map((name) => {
                    const state = states[name] ?? { status: "loading" as const, name };
                    const value = rowValue(row.id, state);
                    const dependencyLoading =
                      row.id === "dependencies" &&
                      state.status === "success" &&
                      state.dependencies.status === "loading";

                    return (
                      <td
                        key={name}
                        className={different ? "comparison-cell--different" : ""}
                      >
                        {state.status === "loading" ? (
                          <span className="comparison-skeleton" aria-hidden="true" />
                        ) : state.status === "error" ? (
                          "Request failed"
                        ) : dependencyLoading ? (
                          <span role="status" aria-live="polite">
                            Loading dependency data…
                          </span>
                        ) : row.id === "dependencies" &&
                          state.dependencies.status === "error" ? (
                          <span className="comparison-dependency-error">
                            Request failed
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => onRetryDependencies(name)}
                            >
                              Retry dependency data
                            </button>
                          </span>
                        ) : row.id === "repository" && state.details.repositoryUrl ? (
                          <a
                            className="comparison-external-link"
                            href={state.details.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open repository
                            <ArrowUpRight aria-hidden="true" size={13} />
                          </a>
                        ) : row.id === "homepage" && state.details.homepageUrl ? (
                          <a
                            className="comparison-external-link"
                            href={state.details.homepageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open homepage
                            <ArrowUpRight aria-hidden="true" size={13} />
                          </a>
                        ) : (
                          value
                        )}
                        {different && state.status === "success" && value && (
                          <span className="visually-hidden">
                            This value differs from another available package value.
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {packageNames.map((name) => (
        <ComparisonPackageLoader
          key={`${name}:${packageRetries[name] ?? 0}`}
          name={name}
          packageRetry={packageRetries[name] ?? 0}
          dependencyRetry={dependencyRetries[name] ?? 0}
          onState={handleStateChange}
        />
      ))}
      <p className="comparison-table__data-note">
        Registry fields may be incomplete. Different values are highlighted only to aid
        scanning; PackagePulse does not rank or recommend packages.
      </p>
    </section>
  );
}
