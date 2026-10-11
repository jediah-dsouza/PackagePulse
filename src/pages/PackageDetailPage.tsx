import { ArrowLeft, Info } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PackageDetailSkeleton } from "../features/packageDetail/components/PackageDetailSkeleton";
import { PackageDetailsView } from "../features/packageDetail/components/PackageDetailsView";
import { usePackageDetails } from "../features/packageDetail/usePackageDetails";
import { isValidNpmPackageName } from "../services/npmRegistry/npmRegistryService";
import { usePageTitle } from "../utils/usePageTitle";

function searchRoute(packageName: string): string {
  return `/explore?q=${encodeURIComponent(packageName)}`;
}

function PackageDetailError({
  packageName,
  code,
  retryAfterSeconds,
  retry,
}: {
  packageName: string;
  code: string;
  retryAfterSeconds?: number;
  retry: () => void;
}) {
  const notFound = code === "not-found";
  const title = notFound
    ? "Package not found in the npm Registry."
    : code === "rate-limited"
      ? "The npm Registry is limiting package requests."
      : code === "network"
        ? "Couldn't reach the npm Registry."
        : code === "server"
          ? "The npm Registry is temporarily unavailable."
          : code === "too-large"
            ? "Package metadata exceeded the safe read limit."
            : "Package details couldn't be read.";
  const description = notFound
    ? "Check the package name, or return to Explore to search for another record."
    : code === "rate-limited"
      ? retryAfterSeconds === undefined
        ? "Wait a little before retrying. PackagePulse will not retry automatically."
        : `The Registry asked clients to wait at least ${Math.max(1, retryAfterSeconds)} seconds. PackagePulse will not retry automatically.`
      : code === "network"
        ? "Check your connection, then retry loading this package record."
        : code === "server"
          ? "The Registry returned a server error. Try again in a moment."
          : code === "too-large"
            ? "Even the reduced response was too large to read safely. The latest-version record may be unavailable too."
            : "The Registry returned a response that could not be validated. Retry or check the package name.";

  return (
    <section
      className="package-detail-error"
      role="alert"
      aria-labelledby="detail-error-heading"
    >
      <Info aria-hidden="true" size={18} />
      <div>
        <h1 id="detail-error-heading">{title}</h1>
        <p>
          <code>{packageName}</code> — {description}
        </p>
        <div className="package-detail-error__actions">
          {!notFound && (
            <button className="button button--secondary" type="button" onClick={retry}>
              Retry package request
            </button>
          )}
          <Link className="text-link" to={searchRoute(packageName)}>
            <ArrowLeft aria-hidden="true" size={15} />
            Search packages
          </Link>
        </div>
      </div>
    </section>
  );
}

function InvalidPackageRoute({ packageName }: { packageName: string }) {
  return (
    <section className="package-detail-error" role="alert">
      <Info aria-hidden="true" size={18} />
      <div>
        <h1>That package name is not valid.</h1>
        <p>PackagePulse did not send a Registry request for this route.</p>
        <Link className="text-link" to="/explore">
          <ArrowLeft aria-hidden="true" size={15} />
          Return to Explore
        </Link>
      </div>
      <span className="visually-hidden">{packageName}</span>
    </section>
  );
}

export function PackageDetailPage() {
  const { name = "" } = useParams();
  const packageName = name;
  const {
    state,
    details,
    selectedVersion,
    versionState,
    selectVersion,
    retry,
    retryVersion,
  } = usePackageDetails(packageName);

  usePageTitle(
    details?.name
      ? `Package ${details.name}`
      : packageName
        ? `Package ${packageName}`
        : "Package details",
  );

  const stateMatchesRoute = state.packageName === packageName;
  const currentState = stateMatchesRoute ? state : { status: "loading" as const };

  return (
    <div className="page-container route-page package-detail-page">
      <Link className="package-detail-back" to="/explore">
        <ArrowLeft aria-hidden="true" size={15} />
        Explore packages
      </Link>

      {currentState.status === "invalid-name" || !isValidNpmPackageName(packageName) ? (
        <InvalidPackageRoute packageName={packageName} />
      ) : currentState.status === "loading" ? (
        <PackageDetailSkeleton />
      ) : currentState.status === "error" ? (
        <PackageDetailError
          packageName={packageName}
          code={currentState.error.code}
          retryAfterSeconds={currentState.error.retryAfterSeconds}
          retry={retry}
        />
      ) : details ? (
        <PackageDetailsView
          key={packageName}
          details={details}
          selectedVersion={selectedVersion}
          versionState={versionState}
          onSelectVersion={selectVersion}
          onRetryVersion={retryVersion}
        />
      ) : (
        <PackageDetailSkeleton />
      )}
    </div>
  );
}
