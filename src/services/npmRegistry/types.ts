export type PackageSummary = {
  name: string;
  description?: string;
  descriptionTruncated?: boolean;
  latestVersion?: string;
  keywords: string[];
  keywordsTruncated?: boolean;
  publishedAt?: string;
  license?: string;
  repositoryUrl?: string;
  homepageUrl?: string;
  npmUrl?: string;
};

export type RegistrySearchPage = {
  items: PackageSummary[];
  total?: number;
  offset: number;
  size: number;
  nextOffset: number;
  hasMore: boolean;
};

export type NpmRegistryErrorCode =
  | "network"
  | "not-found"
  | "rate-limited"
  | "server"
  | "invalid-response"
  | "aborted"
  | "invalid-package-name"
  | "invalid-version"
  | "too-large"
  | "unknown";

export class NpmRegistryError extends Error {
  readonly code: NpmRegistryErrorCode;
  readonly retryAfterSeconds?: number;
  readonly limitBytes?: number;

  constructor(
    code: NpmRegistryErrorCode,
    options: {
      retryAfterSeconds?: number;
      limitBytes?: number;
      cause?: unknown;
    } = {},
  ) {
    super(code, { cause: options.cause });
    this.name = "NpmRegistryError";
    this.code = code;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.limitBytes = options.limitBytes;
  }
}

// Keep the Phase 2 import name stable while sharing one error contract.
export {
  NpmRegistryError as RegistrySearchError,
  type NpmRegistryErrorCode as RegistrySearchErrorCode,
};

export type SearchPageOptions = {
  offset?: number;
  size?: number;
  signal?: AbortSignal;
};

export type PackageRelease = {
  version: string;
  publishedAt?: string;
};

export type PackageReleaseHistory =
  | {
      status: "available";
      versions: PackageRelease[];
      publicationDatesAvailable: boolean;
    }
  | {
      status: "unavailable";
      reason: "not-provided" | "response-too-large" | "too-many-versions";
    };

export type PackageMetadataMode = "full" | "abbreviated" | "latest-only";

export type PackageDetails = PackageSummary & {
  releaseHistory: PackageReleaseHistory;
  metadataMode: PackageMetadataMode;
  latestVersionDetails?: PackageVersionDetails;
};

export type PackageDependency = {
  name: string;
  range: string;
};

export type PackageDependencyGroup = {
  kind: "dependencies" | "peerDependencies" | "optionalDependencies";
  status: "available" | "partial" | "unavailable";
  omittedByLimit?: boolean;
  items: PackageDependency[];
};

export type PackageVersionDetails = {
  version: string;
  license?: string;
  dependencyGroups: PackageDependencyGroup[];
};

export type NpmPackageRequestOptions = {
  signal?: AbortSignal;
};
