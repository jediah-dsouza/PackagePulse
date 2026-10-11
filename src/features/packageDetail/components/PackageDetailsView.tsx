import { useState } from "react";
import {
  ArrowUpRight,
  Clipboard,
  Copy,
  ExternalLink,
  Package as PackageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CompareSelectionButton } from "../../comparison/CompareSelectionButton";
import { SavedPackageButton } from "../../saved/SavedPackageButton";
import type {
  PackageDependencyGroup,
  PackageDetails,
  PackageRelease,
} from "../../../services/npmRegistry/types";
import type { PackageVersionRequestState } from "../usePackageDetails";

const INITIAL_RELEASES_TO_SHOW = 20;
const RELEASES_PER_PAGE = 20;
const DEPENDENCIES_PER_GROUP_LIMIT = 40;

function displayDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function ExternalMetadataLink({
  href,
  children,
}: {
  href: string | undefined;
  children: string;
}) {
  if (!href) return <span>Not provided</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

function InstallCommandPanel({
  packageName,
  selectedVersion,
}: {
  packageName: string;
  selectedVersion: string;
}) {
  const [copyMessage, setCopyMessage] = useState("");
  const command = selectedVersion
    ? `npm install ${packageName}@${selectedVersion}`
    : `npm install ${packageName}`;

  async function copyCommand() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(command);
      setCopyMessage("Install command copied.");
    } catch {
      setCopyMessage("Clipboard unavailable. Select the command above to copy it.");
    }
  }

  return (
    <section className="install-command-panel" aria-labelledby="install-heading">
      <div>
        <p className="eyebrow">Install command</p>
        <h2 id="install-heading">Add this package</h2>
        <code className="install-command-panel__command">{command}</code>
      </div>
      <button
        className="button button--secondary"
        type="button"
        onClick={copyCommand}
        aria-label="Copy install command"
      >
        {copyMessage === "Install command copied." ? (
          <Clipboard aria-hidden="true" size={16} />
        ) : (
          <Copy aria-hidden="true" size={16} />
        )}
        {copyMessage === "Install command copied." ? "Copied" : "Copy command"}
      </button>
      <span className="visually-hidden" role="status" aria-live="polite">
        {copyMessage}
      </span>
      {copyMessage.startsWith("Clipboard unavailable") && (
        <p className="install-command-panel__copy-error">{copyMessage}</p>
      )}
    </section>
  );
}

function PackageQuickFacts({ details }: { details: PackageDetails }) {
  const facts = [
    { label: "Latest version", value: details.latestVersion },
    { label: "License", value: details.license },
    { label: "Last published", value: displayDate(details.publishedAt) },
    {
      label: "Repository",
      value: (
        <ExternalMetadataLink href={details.repositoryUrl}>
          Open repository
        </ExternalMetadataLink>
      ),
    },
    {
      label: "Homepage",
      value: (
        <ExternalMetadataLink href={details.homepageUrl}>
          Open homepage
        </ExternalMetadataLink>
      ),
    },
    {
      label: "npm Registry",
      value: (
        <ExternalMetadataLink href={details.npmUrl}>
          Open npm package
        </ExternalMetadataLink>
      ),
    },
  ];

  return (
    <section className="package-detail-section" aria-labelledby="package-facts-heading">
      <div className="section-heading">
        <h2 id="package-facts-heading">Package metadata</h2>
        <p>Values are shown as returned by the public npm Registry.</p>
      </div>
      <dl className="metadata-list package-facts">
        {facts.map(({ label, value }) => (
          <div className="metadata-list__row" key={label}>
            <dt>{label}</dt>
            <dd>
              {label === "Latest version" && details.latestVersion ? (
                <code>{details.latestVersion}</code>
              ) : (
                (value ?? "Not provided")
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PackageKeywords({
  keywords,
  truncated,
}: {
  keywords: string[];
  truncated?: boolean;
}) {
  return (
    <section className="package-keywords" aria-labelledby="package-keywords-heading">
      <h2 id="package-keywords-heading">Keywords</h2>
      {keywords.length > 0 ? (
        <ul className="package-keywords__list">
          {keywords.map((keyword) => (
            <li key={keyword}>{keyword}</li>
          ))}
        </ul>
      ) : (
        <p>Not provided by the registry.</p>
      )}
      {truncated && (
        <p className="package-data-note">
          Registry keyword entries were omitted by safety limits.
        </p>
      )}
    </section>
  );
}

function PublicationValue({ release }: { release: PackageRelease }) {
  const formatted = displayDate(release.publishedAt);
  if (!formatted || !release.publishedAt) return <span>Date not provided</span>;
  return <time dateTime={release.publishedAt}>{formatted}</time>;
}

function VersionHistory({ details }: { details: PackageDetails }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_RELEASES_TO_SHOW);

  if (details.releaseHistory.status === "unavailable") {
    const message =
      details.releaseHistory.reason === "response-too-large"
        ? "The registry record exceeded the safe size limit. Package details remain available, but the complete release list could not be loaded."
        : details.releaseHistory.reason === "too-many-versions"
          ? "The registry returned more than 5,000 versions. Release history is unavailable to keep the page responsive; the latest release can still be inspected."
          : "The registry did not provide a version list for this package.";
    return (
      <section
        className="package-detail-section"
        aria-labelledby="version-history-heading"
      >
        <div className="section-heading">
          <h2 id="version-history-heading">Versions and releases</h2>
          <p>{message}</p>
        </div>
      </section>
    );
  }

  const versions = details.releaseHistory.versions;
  const visibleVersions = versions.slice(0, visibleCount);
  const hasMore = visibleCount < versions.length;

  return (
    <section
      className="package-detail-section"
      aria-labelledby="version-history-heading"
    >
      <div className="section-heading">
        <h2 id="version-history-heading">Versions and releases</h2>
        <p>
          {versions.length} version{versions.length === 1 ? "" : "s"} returned by the
          registry, newest first.
        </p>
      </div>
      {!details.releaseHistory.publicationDatesAvailable && versions.length > 0 && (
        <p className="package-data-note">
          Publication timestamps were not included in this registry response.
        </p>
      )}
      {versions.length > 0 ? (
        <>
          <ol className="release-list">
            {visibleVersions.map((release) => (
              <li className="release-list__item" key={release.version}>
                <code>{release.version}</code>
                <PublicationValue release={release} />
                {release.version === details.latestVersion && (
                  <span className="release-list__latest">Latest</span>
                )}
              </li>
            ))}
          </ol>
          {hasMore && (
            <button
              className="button button--secondary release-list__more"
              type="button"
              onClick={() =>
                setVisibleCount((current) =>
                  Math.min(current + RELEASES_PER_PAGE, versions.length),
                )
              }
            >
              Show {Math.min(RELEASES_PER_PAGE, versions.length - visibleCount)} more
              versions
            </button>
          )}
          {!hasMore && versions.length > INITIAL_RELEASES_TO_SHOW && (
            <button
              className="text-button release-list__more"
              type="button"
              onClick={() => setVisibleCount(INITIAL_RELEASES_TO_SHOW)}
            >
              Show fewer versions
            </button>
          )}
        </>
      ) : (
        <p className="package-data-note">No version entries were returned.</p>
      )}
    </section>
  );
}

function dependencyGroupLabel(kind: PackageDependencyGroup["kind"]): string {
  if (kind === "peerDependencies") return "Peer dependencies";
  if (kind === "optionalDependencies") return "Optional dependencies";
  return "Dependencies";
}

function DependencyGroupDisclosure({ group }: { group: PackageDependencyGroup }) {
  const [showAll, setShowAll] = useState(false);
  const label = dependencyGroupLabel(group.kind);
  const hiddenCount = Math.max(0, group.items.length - DEPENDENCIES_PER_GROUP_LIMIT);
  const visibleItems = showAll
    ? group.items
    : group.items.slice(0, DEPENDENCIES_PER_GROUP_LIMIT);
  const listId = `dependency-list-${group.kind}`;

  let summary =
    group.status === "unavailable" ? "Not available" : `${group.items.length} listed`;
  if (group.status === "partial") summary = `${group.items.length} valid entries`;

  return (
    <details
      className="dependency-group"
      open={group.kind === "dependencies"}
      key={group.kind}
    >
      <summary>
        <span>{label}</span>
        <span className="dependency-group__count">{summary}</span>
      </summary>
      <div className="dependency-group__content">
        {group.status === "unavailable" ? (
          <p className="package-data-note">
            The registry did not return usable {label.toLowerCase()} data for this
            version.
          </p>
        ) : group.items.length === 0 ? (
          <p className="package-data-note">No {label.toLowerCase()} are listed.</p>
        ) : (
          <>
            {group.status === "partial" && (
              <p className="package-data-note">
                {group.omittedByLimit
                  ? "Additional dependency entries were omitted after the 2,000-entry safety limit."
                  : "Some entries were omitted because the registry returned invalid fields."}
              </p>
            )}
            <ul className="dependency-list" id={listId}>
              {visibleItems.map((dependency) => (
                <li className="dependency-list__item" key={dependency.name}>
                  <Link to={`/package/${encodeURIComponent(dependency.name)}`}>
                    <code>{dependency.name}</code>
                  </Link>
                  <code className="dependency-list__range">{dependency.range}</code>
                </li>
              ))}
            </ul>
            {hiddenCount > 0 && (
              <button
                className="text-button dependency-list__toggle"
                type="button"
                aria-controls={listId}
                aria-expanded={showAll}
                onClick={() => setShowAll((current) => !current)}
              >
                {showAll
                  ? "Show less"
                  : `Show all ${group.items.length} ${label.toLowerCase()}`}
              </button>
            )}
          </>
        )}
      </div>
    </details>
  );
}

function DependencyContent({
  versionState,
  selectedVersion,
  onRetry,
}: {
  versionState: PackageVersionRequestState;
  selectedVersion: string;
  onRetry: () => void;
}) {
  if (!selectedVersion) {
    return (
      <p className="package-data-note">Select a version to inspect its dependencies.</p>
    );
  }

  if (versionState.status === "loading" || versionState.status === "idle") {
    return (
      <div className="dependency-loading" role="status" aria-live="polite">
        Loading dependency data for <code>{selectedVersion}</code>…
      </div>
    );
  }

  if (versionState.version !== selectedVersion) {
    return (
      <div className="dependency-loading" role="status" aria-live="polite">
        Loading dependency data for <code>{selectedVersion}</code>…
      </div>
    );
  }

  if (versionState.status === "error") {
    const errorCopy =
      versionState.error.code === "not-found"
        ? "That version is no longer available in the registry."
        : versionState.error.code === "rate-limited"
          ? "The npm Registry is limiting version requests. Wait a little before retrying."
          : versionState.error.code === "too-large"
            ? "This version record exceeded the safe read limit. Its dependency data is unavailable."
            : "Dependency data for this version could not be loaded.";
    return (
      <div className="dependency-error" role="alert">
        <p>{errorCopy}</p>
        {versionState.error.code !== "not-found" && (
          <button className="button button--secondary" type="button" onClick={onRetry}>
            Retry version details
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dependency-groups">
      {versionState.details.dependencyGroups.map((group) => (
        <DependencyGroupDisclosure group={group} key={group.kind} />
      ))}
    </div>
  );
}

function PackageDataNotice({ details }: { details: PackageDetails }) {
  if (details.metadataMode === "full") return null;
  return (
    <aside className="package-data-note package-data-note--notice">
      <ArrowUpRight aria-hidden="true" size={16} />
      <p>
        The full registry record exceeded the 12 MiB read limit. PackagePulse used a
        reduced response, so some release dates or older version details may be
        unavailable.
      </p>
    </aside>
  );
}

export function PackageDetailsView({
  details,
  selectedVersion,
  versionState,
  onSelectVersion,
  onRetryVersion,
}: {
  details: PackageDetails;
  selectedVersion: string;
  versionState: PackageVersionRequestState;
  onSelectVersion: (version: string) => void;
  onRetryVersion: () => void;
}) {
  const [packageNameCopyMessage, setPackageNameCopyMessage] = useState("");
  const releases =
    details.releaseHistory.status === "available"
      ? details.releaseHistory.versions
      : [];
  const versionOptions = [...releases];
  if (
    details.latestVersion &&
    !versionOptions.some((release) => release.version === details.latestVersion)
  ) {
    versionOptions.unshift({ version: details.latestVersion });
  }

  async function copyPackageName() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(details.name);
      setPackageNameCopyMessage("Package name copied.");
    } catch {
      setPackageNameCopyMessage(
        "Clipboard unavailable. Select the package name above to copy it.",
      );
    }
  }

  return (
    <>
      <header className="package-detail-heading">
        <div className="package-detail-heading__mark">
          <PackageIcon aria-hidden="true" size={22} strokeWidth={1.8} />
        </div>
        <div className="package-detail-heading__identity">
          <p className="package-detail-heading__label">Package record</p>
          <div className="package-detail-heading__name-row">
            <h1>
              <code>{details.name}</code>
            </h1>
            <button
              className="button button--secondary package-name-copy"
              type="button"
              aria-label="Copy package name"
              onClick={copyPackageName}
            >
              {packageNameCopyMessage === "Package name copied." ? (
                <Clipboard aria-hidden="true" size={16} />
              ) : (
                <Copy aria-hidden="true" size={16} />
              )}
              <span>
                {packageNameCopyMessage === "Package name copied."
                  ? "Copied"
                  : "Copy name"}
              </span>
            </button>
            <CompareSelectionButton
              packageName={details.name}
              className="package-detail-heading__compare"
            />
            <SavedPackageButton packageName={details.name} />
          </div>
          {packageNameCopyMessage.endsWith("copied.") && (
            <span className="visually-hidden" role="status" aria-live="polite">
              {packageNameCopyMessage}
            </span>
          )}
          {packageNameCopyMessage.startsWith("Clipboard unavailable") && (
            <p className="package-name-copy__error" role="alert">
              {packageNameCopyMessage}
            </p>
          )}
          <p>{details.description || "No description provided by the registry."}</p>
          {details.descriptionTruncated && (
            <p className="package-data-note">
              Description shortened to a safe display length.
            </p>
          )}
          <a
            className="package-detail-heading__npm-link"
            href={details.npmUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden="true" size={15} />
            Open npm package (new tab)
          </a>
        </div>
      </header>

      <InstallCommandPanel
        packageName={details.name}
        selectedVersion={selectedVersion}
      />

      <PackageDataNotice details={details} />
      <PackageQuickFacts details={details} />
      <PackageKeywords
        keywords={details.keywords}
        truncated={details.keywordsTruncated}
      />

      <section
        className="package-detail-section"
        aria-labelledby="selected-version-heading"
      >
        <div className="section-heading">
          <h2 id="selected-version-heading">Inspect a release</h2>
          <p>Choose a published version to review its dependency ranges.</p>
        </div>
        {versionOptions.length > 0 ? (
          <label className="version-selector">
            <span>Package version</span>
            <select
              value={selectedVersion}
              onChange={(event) => onSelectVersion(event.currentTarget.value)}
              aria-label="Package version"
            >
              {!selectedVersion && <option value="">Select a version</option>}
              {versionOptions.map((release) => (
                <option value={release.version} key={release.version}>
                  {release.version}
                  {release.version === details.latestVersion ? " — latest" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="package-data-note">
            No version is available to select from this registry record.
          </p>
        )}
      </section>

      <section
        className="package-detail-section"
        aria-labelledby="dependencies-heading"
      >
        <div className="section-heading">
          <h2 id="dependencies-heading">Dependencies</h2>
          <p>
            Registry version ranges only; this is not a resolved or transitive
            dependency tree.
          </p>
        </div>
        <DependencyContent
          versionState={versionState}
          selectedVersion={selectedVersion}
          onRetry={onRetryVersion}
        />
      </section>

      <VersionHistory details={details} />
    </>
  );
}
