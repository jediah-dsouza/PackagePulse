import {
  NpmRegistryError,
  type PackageDependencyGroup,
  type PackageDetails,
  type PackageMetadataMode,
  type PackageRelease,
  type PackageVersionDetails,
  type RegistrySearchPage,
  type SearchPageOptions,
  type NpmPackageRequestOptions,
  type PackageSummary,
} from "./types";

export const NPM_REGISTRY_BASE_URL = "https://registry.npmjs.org" as const;
export const NPM_SEARCH_ENDPOINT = `${NPM_REGISTRY_BASE_URL}/-/v1/search` as const;
export const DEFAULT_SEARCH_PAGE_SIZE = 20;
export const MAX_PACKAGE_METADATA_BYTES = 12 * 1024 * 1024;
export const MAX_PACKAGE_VERSION_BYTES = 2 * 1024 * 1024;
const MAX_SEARCH_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_SEARCH_PAGE_SIZE = 250;
const MAX_PACKAGE_NAME_LENGTH = 214;
const MAX_PACKAGE_VERSION_LENGTH = 128;
export const MAX_PACKAGE_DESCRIPTION_LENGTH = 4_096;
export const MAX_PACKAGE_KEYWORDS = 100;
export const MAX_PACKAGE_KEYWORD_LENGTH = 128;
export const MAX_PACKAGE_KEYWORD_ENTRIES_SCANNED = 200;
export const MAX_PACKAGE_VERSIONS = 5_000;
export const MAX_DEPENDENCIES_PER_GROUP = 2_000;
export const MAX_DEPENDENCY_RANGE_LENGTH = 512;
const MAX_LICENSE_LENGTH = 256;
const MAX_EXTERNAL_URL_LENGTH = 2_048;
const MAX_DATE_LENGTH = 64;
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const PACKAGE_VERSION_PATTERN = /^[0-9A-Za-z.+_-]+$/;
const ABBREVIATED_METADATA_ACCEPT = "application/vnd.npm.install-v1+json";
const COMPLETE_METADATA_ACCEPT = "application/json";
const SEMVER_PATTERN =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const VERSION_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

type UnknownRecord = Record<string, unknown>;
type StringListMapping = { values: string[]; truncated: boolean };

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type NormalizedString = { value?: string; overLimit: boolean };

function hasOuterWhitespace(value: string): boolean {
  return /\s/u.test(value[0] ?? "") || /\s/u.test(value[value.length - 1] ?? "");
}

function normalizeString(value: unknown, maximumLength?: number): NormalizedString {
  if (typeof value !== "string") return { overLimit: false };

  // Avoid scanning/copying an obviously oversized unpadded field before dropping it.
  // Padded values still take the normal trim path, preserving accepted input semantics.
  if (
    maximumLength !== undefined &&
    value.length > maximumLength &&
    !hasOuterWhitespace(value)
  ) {
    return { overLimit: true };
  }

  const trimmed = value.trim();
  if (!trimmed) return { overLimit: false };
  if (maximumLength !== undefined && trimmed.length > maximumLength) {
    return { overLimit: true };
  }
  return { value: trimmed, overLimit: false };
}

function optionalString(value: unknown, maximumLength?: number): string | undefined {
  return normalizeString(value, maximumLength).value;
}

function boundedString(value: unknown, maximumLength: number) {
  if (
    typeof value === "string" &&
    value.length > maximumLength &&
    !hasOuterWhitespace(value)
  ) {
    return {
      value: `${value.slice(0, maximumLength - 1)}…`,
      truncated: true,
    };
  }
  const text = optionalString(value);
  if (!text || text.length <= maximumLength) {
    return { value: text, truncated: false };
  }
  return {
    value: `${text.slice(0, maximumLength - 1)}…`,
    truncated: true,
  };
}

function stringList(value: unknown): StringListMapping {
  if (!Array.isArray(value)) return { values: [], truncated: false };
  const values = new Set<string>();
  const scannedEntries = Math.min(value.length, MAX_PACKAGE_KEYWORD_ENTRIES_SCANNED);
  let truncated = value.length > scannedEntries;

  for (let index = 0; index < scannedEntries; index += 1) {
    const normalized = normalizeString(value[index], MAX_PACKAGE_KEYWORD_LENGTH);
    if (normalized.overLimit) {
      truncated = true;
      continue;
    }
    const entry = normalized.value;
    if (!entry) continue;
    if (values.has(entry)) continue;
    if (values.size >= MAX_PACKAGE_KEYWORDS) {
      truncated = true;
      break;
    }
    values.add(entry);
  }
  return { values: [...values], truncated };
}

export function isValidNpmPackageName(value: string): boolean {
  return value.length <= MAX_PACKAGE_NAME_LENGTH && PACKAGE_NAME_PATTERN.test(value);
}

function isValidNpmVersion(value: string): boolean {
  return (
    value.length <= MAX_PACKAGE_VERSION_LENGTH &&
    PACKAGE_VERSION_PATTERN.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

function assertPackageName(packageName: string): void {
  if (!isValidNpmPackageName(packageName)) {
    throw new NpmRegistryError("invalid-package-name");
  }
}

function assertPackageVersion(version: string): void {
  if (!isValidNpmVersion(version)) {
    throw new NpmRegistryError("invalid-version");
  }
}

export function buildNpmSearchUrl(
  query: string,
  options: Pick<SearchPageOptions, "offset" | "size"> = {},
): URL {
  const url = new URL(NPM_SEARCH_ENDPOINT);
  url.searchParams.set("text", query.trim());
  url.searchParams.set("size", String(normalizePageSize(options.size)));
  url.searchParams.set("from", String(normalizeOffset(options.offset)));
  return url;
}

export function buildNpmPackageMetadataUrl(packageName: string): URL {
  assertPackageName(packageName);
  return new URL(encodeURIComponent(packageName), `${NPM_REGISTRY_BASE_URL}/`);
}

export function buildNpmPackageVersionUrl(packageName: string, version: string): URL {
  assertPackageName(packageName);
  assertPackageVersion(version);
  return new URL(
    `${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`,
    `${NPM_REGISTRY_BASE_URL}/`,
  );
}

function safeHttpUrl(value: unknown): string | undefined {
  let rawValue = optionalString(value, MAX_EXTERNAL_URL_LENGTH);
  if (!rawValue) return undefined;

  if (rawValue.startsWith("git+")) {
    rawValue = rawValue.slice("git+".length);
  }

  try {
    const url = new URL(rawValue);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

function repositoryUrl(value: unknown): string | undefined {
  if (typeof value === "string") return safeHttpUrl(value);
  if (!isRecord(value)) return undefined;
  return safeHttpUrl(value.url) ?? safeHttpUrl(value.web);
}

function licenseText(value: unknown): string | undefined {
  const asString = optionalString(value, MAX_LICENSE_LENGTH);
  if (asString) return asString;
  if (isRecord(value)) {
    return optionalString(value.type, MAX_LICENSE_LENGTH);
  }
  return undefined;
}

function parseIsoDate(value: unknown): string | undefined {
  const candidate = optionalString(value, MAX_DATE_LENGTH);
  if (!candidate || Number.isNaN(Date.parse(candidate))) return undefined;
  return candidate;
}

function parseTotal(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

function normalizePageSize(size: number | undefined): number {
  if (!Number.isFinite(size)) return DEFAULT_SEARCH_PAGE_SIZE;
  return Math.max(
    1,
    Math.min(MAX_SEARCH_PAGE_SIZE, Math.floor(size ?? DEFAULT_SEARCH_PAGE_SIZE)),
  );
}

function normalizeOffset(offset: number | undefined): number {
  if (!Number.isFinite(offset)) return 0;
  return Math.max(0, Math.floor(offset ?? 0));
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return undefined;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

function mapHttpError(response: Response): NpmRegistryError {
  if (response.status === 404) return new NpmRegistryError("not-found");
  if (response.status === 429) {
    return new NpmRegistryError("rate-limited", {
      retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
    });
  }
  if (response.status >= 500) return new NpmRegistryError("server");
  return new NpmRegistryError("unknown");
}

function isAbortError(error: unknown): boolean {
  return (
    isRecord(error) && typeof error.name === "string" && error.name === "AbortError"
  );
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The response may already have been cancelled by the browser.
  }
}

async function readBoundedJson(
  response: Response,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<unknown> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await cancelResponseBody(response);
    throw new NpmRegistryError("too-large", { limitBytes: maxBytes });
  }

  if (!response.body) throw new NpmRegistryError("invalid-response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  let tooLarge = false;

  try {
    while (true) {
      if (signal?.aborted) throw new NpmRegistryError("aborted");
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        tooLarge = true;
        break;
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof NpmRegistryError) throw error;
    if (signal?.aborted || isAbortError(error)) {
      throw new NpmRegistryError("aborted", { cause: error });
    }
    throw new NpmRegistryError("network", { cause: error });
  } finally {
    if (!tooLarge) reader.releaseLock();
  }

  if (tooLarge) {
    try {
      await reader.cancel();
    } catch {
      // Stop reading once the configured byte ceiling has been crossed.
    }
    throw new NpmRegistryError("too-large", { limitBytes: maxBytes });
  }

  const textBytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    textBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(textBytes);
  } catch (error) {
    throw new NpmRegistryError("invalid-response", { cause: error });
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new NpmRegistryError("invalid-response", { cause: error });
  }
}

async function fetchRegistryJson(
  url: URL,
  accept: string,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: accept },
      signal,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      throw new NpmRegistryError("aborted", { cause: error });
    }
    throw new NpmRegistryError("network", { cause: error });
  }

  if (!response.ok) {
    await cancelResponseBody(response);
    throw mapHttpError(response);
  }
  return readBoundedJson(response, maxBytes, signal);
}

function mapSearchSummary(value: unknown): PackageSummary | undefined {
  if (!isRecord(value) || !isRecord(value.package)) return undefined;

  const packageData = value.package;
  const name = optionalString(packageData.name, MAX_PACKAGE_NAME_LENGTH);
  if (!name || !isValidNpmPackageName(name)) return undefined;

  const links = isRecord(packageData.links) ? packageData.links : {};
  const description = boundedString(
    packageData.description,
    MAX_PACKAGE_DESCRIPTION_LENGTH,
  );
  const keywords = stringList(packageData.keywords);
  const version = optionalString(packageData.version, MAX_PACKAGE_VERSION_LENGTH);
  return {
    name,
    description: description.value,
    ...(description.truncated ? { descriptionTruncated: true } : {}),
    latestVersion: version && isValidNpmVersion(version) ? version : undefined,
    keywords: keywords.values,
    ...(keywords.truncated ? { keywordsTruncated: true } : {}),
    publishedAt: parseIsoDate(packageData.date),
    license: licenseText(packageData.license),
    repositoryUrl: safeHttpUrl(links.repository),
    homepageUrl: safeHttpUrl(links.homepage),
    npmUrl: safeNpmPageUrl(name),
  };
}

export function mapNpmSearchResponse(
  payload: unknown,
  offset: number,
  size: number,
): RegistrySearchPage {
  if (!isRecord(payload) || !Array.isArray(payload.objects)) {
    throw new NpmRegistryError("invalid-response");
  }

  const rawObjects = payload.objects;
  const normalizedSize = normalizePageSize(size);
  if (rawObjects.length > normalizedSize) {
    throw new NpmRegistryError("invalid-response");
  }
  const items = rawObjects
    .map(mapSearchSummary)
    .filter((item): item is PackageSummary => item !== undefined);

  if (rawObjects.length > 0 && items.length === 0) {
    throw new NpmRegistryError("invalid-response");
  }

  const total = parseTotal(payload.total);
  const normalizedOffset = normalizeOffset(offset);
  const nextOffset = normalizedOffset + rawObjects.length;
  const hasMore =
    rawObjects.length > 0 &&
    (total === undefined ? rawObjects.length >= normalizedSize : nextOffset < total);

  return {
    items,
    total,
    offset: normalizedOffset,
    size: normalizedSize,
    nextOffset,
    hasMore,
  };
}

function compareVersionDescending(left: string, right: string): number {
  const leftMatch = SEMVER_PATTERN.exec(left);
  const rightMatch = SEMVER_PATTERN.exec(right);
  if (!leftMatch || !rightMatch) return VERSION_COLLATOR.compare(right, left);

  for (const index of [1, 2, 3]) {
    const difference = Number(rightMatch[index]) - Number(leftMatch[index]);
    if (difference !== 0) return difference;
  }

  const leftPrerelease = leftMatch[4];
  const rightPrerelease = rightMatch[4];
  if (!leftPrerelease || !rightPrerelease) {
    if (leftPrerelease === rightPrerelease) return 0;
    return leftPrerelease ? 1 : -1;
  }

  const leftParts = leftPrerelease.split(".");
  const rightParts = rightPrerelease.split(".");
  const sharedLength = Math.min(leftParts.length, rightParts.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const leftPart = leftParts[index] ?? "";
    const rightPart = rightParts[index] ?? "";
    if (leftPart === rightPart) continue;
    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric && rightNumeric) {
      return Number(rightPart) - Number(leftPart);
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? 1 : -1;
    return VERSION_COLLATOR.compare(rightPart, leftPart);
  }
  return rightParts.length - leftParts.length;
}

function sortReleases(releases: PackageRelease[]): PackageRelease[] {
  return [...releases].sort((left, right) => {
    const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : undefined;
    const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : undefined;
    if (leftTime !== undefined && rightTime !== undefined && leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    if (leftTime !== undefined && rightTime === undefined) return -1;
    if (leftTime === undefined && rightTime !== undefined) return 1;
    return compareVersionDescending(left.version, right.version);
  });
}

function safeNpmPageUrl(packageName: string): string {
  return new URL(`/package/${packageName}`, "https://www.npmjs.com").href;
}

function readKeywords(primary: unknown, fallback: unknown): StringListMapping {
  if (Array.isArray(primary)) return stringList(primary);
  return stringList(fallback);
}

function detailsFromManifest(
  packageName: string,
  manifest: UnknownRecord,
  options: {
    releaseHistory: PackageDetails["releaseHistory"];
    metadataMode: PackageMetadataMode;
    publishedAt?: string;
    latestVersionDetails?: PackageVersionDetails;
    keywords?: StringListMapping;
  },
): PackageDetails {
  const version = optionalString(manifest.version, MAX_PACKAGE_VERSION_LENGTH);
  const description = boundedString(
    manifest.description,
    MAX_PACKAGE_DESCRIPTION_LENGTH,
  );
  const keywords = options.keywords ?? stringList(manifest.keywords);
  return {
    name: packageName,
    description: description.value,
    ...(description.truncated ? { descriptionTruncated: true } : {}),
    latestVersion: version && isValidNpmVersion(version) ? version : undefined,
    keywords: keywords.values,
    ...(keywords.truncated ? { keywordsTruncated: true } : {}),
    publishedAt: options.publishedAt,
    license: licenseText(manifest.license),
    repositoryUrl: repositoryUrl(manifest.repository),
    homepageUrl: safeHttpUrl(manifest.homepage),
    npmUrl: safeNpmPageUrl(packageName),
    releaseHistory: options.releaseHistory,
    metadataMode: options.metadataMode,
    latestVersionDetails: options.latestVersionDetails,
  };
}

function mapDependencyGroup(
  manifest: UnknownRecord,
  kind: PackageDependencyGroup["kind"],
  completeManifest: boolean,
): PackageDependencyGroup {
  if (!completeManifest) return { kind, status: "unavailable", items: [] };

  if (!Object.hasOwn(manifest, kind)) {
    return { kind, status: "available", items: [] };
  }

  const rawItems = manifest[kind];
  if (!isRecord(rawItems)) return { kind, status: "unavailable", items: [] };

  let skipped = 0;
  let truncated = false;
  const items: PackageDependencyGroup["items"] = [];
  for (const name in rawItems) {
    if (!Object.hasOwn(rawItems, name)) continue;
    if (items.length + skipped >= MAX_DEPENDENCIES_PER_GROUP) {
      truncated = true;
      break;
    }
    const range = rawItems[name];
    if (!isValidNpmPackageName(name) || typeof range !== "string") {
      skipped += 1;
      continue;
    }
    const normalizedRange = optionalString(range, MAX_DEPENDENCY_RANGE_LENGTH);
    if (!normalizedRange) {
      skipped += 1;
      continue;
    }
    items.push({ name, range: normalizedRange });
  }
  items.sort((left, right) => left.name.localeCompare(right.name));

  return {
    kind,
    status:
      skipped === 0 && !truncated
        ? "available"
        : items.length > 0
          ? "partial"
          : "unavailable",
    ...(truncated ? { omittedByLimit: true } : {}),
    items,
  };
}

function mapVersionDetails(
  manifest: UnknownRecord,
  expectedVersion: string,
  completeManifest: boolean,
): PackageVersionDetails | undefined {
  const version = optionalString(manifest.version, MAX_PACKAGE_VERSION_LENGTH);
  if (
    !version ||
    !isValidNpmVersion(version) ||
    (expectedVersion !== "latest" && version !== expectedVersion)
  ) {
    return undefined;
  }

  return {
    version,
    license: licenseText(manifest.license),
    dependencyGroups: [
      mapDependencyGroup(manifest, "dependencies", completeManifest),
      mapDependencyGroup(manifest, "peerDependencies", completeManifest),
      mapDependencyGroup(manifest, "optionalDependencies", completeManifest),
    ],
  };
}

function metadataNameMatches(payload: UnknownRecord, expectedName: string): boolean {
  const normalizedName = normalizeString(payload.name, MAX_PACKAGE_NAME_LENGTH);
  if (normalizedName.overLimit) return false;
  const returnedName = normalizedName.value;
  return !returnedName || returnedName === expectedName;
}

export function mapNpmPackageDetailsResponse(
  payload: unknown,
  packageName: string,
  metadataMode: PackageMetadataMode = "full",
): PackageDetails {
  assertPackageName(packageName);
  if (!isRecord(payload) || !metadataNameMatches(payload, packageName)) {
    throw new NpmRegistryError("invalid-response");
  }

  const distTags = isRecord(payload["dist-tags"]) ? payload["dist-tags"] : {};
  if (
    (Object.hasOwn(payload, "dist-tags") && !isRecord(payload["dist-tags"])) ||
    (Object.hasOwn(payload, "versions") && !isRecord(payload.versions))
  ) {
    throw new NpmRegistryError("invalid-response");
  }
  const candidateLatest = optionalString(distTags.latest, MAX_PACKAGE_VERSION_LENGTH);
  const latestVersion =
    candidateLatest && isValidNpmVersion(candidateLatest) ? candidateLatest : undefined;
  const rawVersions = isRecord(payload.versions) ? payload.versions : undefined;
  const times = isRecord(payload.time) ? payload.time : {};

  let versionCount = 0;
  if (rawVersions) {
    for (const version in rawVersions) {
      if (Object.hasOwn(rawVersions, version)) versionCount += 1;
      if (versionCount > MAX_PACKAGE_VERSIONS) break;
    }
  }
  const tooManyVersions = versionCount > MAX_PACKAGE_VERSIONS;
  const releases =
    rawVersions && !tooManyVersions
      ? Object.keys(rawVersions).flatMap((version) => {
          if (!isValidNpmVersion(version)) return [];
          const publishedAt = parseIsoDate(times[version]);
          return [{ version, publishedAt }];
        })
      : [];

  const releaseHistory: PackageDetails["releaseHistory"] = rawVersions
    ? tooManyVersions
      ? { status: "unavailable", reason: "too-many-versions" }
      : {
          status: "available",
          versions: sortReleases(releases),
          publicationDatesAvailable: releases.some((release) => release.publishedAt),
        }
    : { status: "unavailable", reason: "not-provided" };

  const latestManifest =
    latestVersion && rawVersions && isRecord(rawVersions[latestVersion])
      ? rawVersions[latestVersion]
      : undefined;
  const publishedAt = latestVersion ? parseIsoDate(times[latestVersion]) : undefined;
  const latestVersionDetails =
    metadataMode === "full" && latestVersion && latestManifest
      ? mapVersionDetails(latestManifest, latestVersion, metadataMode === "full")
      : undefined;

  const summaryManifest: UnknownRecord = {
    ...payload,
    ...(latestManifest ?? {}),
    name: packageName,
    ...(latestVersion ? { version: latestVersion } : {}),
  };

  return detailsFromManifest(packageName, summaryManifest, {
    releaseHistory,
    metadataMode,
    publishedAt,
    latestVersionDetails,
    keywords: readKeywords(latestManifest?.keywords, payload.keywords),
  });
}

export function mapNpmPackageVersionResponse(
  payload: unknown,
  packageName: string,
  requestedVersion: string,
): PackageVersionDetails {
  assertPackageName(packageName);
  assertPackageVersion(requestedVersion);
  if (!isRecord(payload) || !metadataNameMatches(payload, packageName)) {
    throw new NpmRegistryError("invalid-response");
  }

  const details = mapVersionDetails(payload, requestedVersion, true);
  if (!details) throw new NpmRegistryError("invalid-response");
  return details;
}

function mapLatestOnlyResponse(payload: unknown, packageName: string): PackageDetails {
  if (!isRecord(payload) || !metadataNameMatches(payload, packageName)) {
    throw new NpmRegistryError("invalid-response");
  }
  const versionDetails = mapNpmPackageVersionResponse(payload, packageName, "latest");
  return detailsFromManifest(packageName, payload, {
    releaseHistory: { status: "unavailable", reason: "response-too-large" },
    metadataMode: "latest-only",
    latestVersionDetails: versionDetails,
  });
}

export async function getNpmPackageDetails(
  packageName: string,
  options: NpmPackageRequestOptions = {},
): Promise<PackageDetails> {
  const packageUrl = buildNpmPackageMetadataUrl(packageName);

  try {
    const fullPayload = await fetchRegistryJson(
      packageUrl,
      COMPLETE_METADATA_ACCEPT,
      MAX_PACKAGE_METADATA_BYTES,
      options.signal,
    );
    return mapNpmPackageDetailsResponse(fullPayload, packageName, "full");
  } catch (error) {
    if (!(error instanceof NpmRegistryError) || error.code !== "too-large") {
      throw error;
    }
  }

  try {
    const abbreviatedPayload = await fetchRegistryJson(
      packageUrl,
      ABBREVIATED_METADATA_ACCEPT,
      MAX_PACKAGE_METADATA_BYTES,
      options.signal,
    );
    return mapNpmPackageDetailsResponse(abbreviatedPayload, packageName, "abbreviated");
  } catch (error) {
    if (!(error instanceof NpmRegistryError) || error.code !== "too-large") {
      throw error;
    }
  }

  const latestPayload = await fetchRegistryJson(
    buildNpmPackageVersionUrl(packageName, "latest"),
    COMPLETE_METADATA_ACCEPT,
    MAX_PACKAGE_VERSION_BYTES,
    options.signal,
  );
  return mapLatestOnlyResponse(latestPayload, packageName);
}

export async function getNpmPackageVersionDetails(
  packageName: string,
  version: string,
  options: NpmPackageRequestOptions = {},
): Promise<PackageVersionDetails> {
  const payload = await fetchRegistryJson(
    buildNpmPackageVersionUrl(packageName, version),
    COMPLETE_METADATA_ACCEPT,
    MAX_PACKAGE_VERSION_BYTES,
    options.signal,
  );
  return mapNpmPackageVersionResponse(payload, packageName, version);
}

export async function searchNpmPackages(
  query: string,
  options: SearchPageOptions = {},
): Promise<RegistrySearchPage> {
  const offset = normalizeOffset(options.offset);
  const size = normalizePageSize(options.size);
  if (!query.trim()) {
    return {
      items: [],
      total: 0,
      offset,
      size,
      nextOffset: offset,
      hasMore: false,
    };
  }

  const payload = await fetchRegistryJson(
    buildNpmSearchUrl(query, { offset, size }),
    COMPLETE_METADATA_ACCEPT,
    MAX_SEARCH_RESPONSE_BYTES,
    options.signal,
  );
  return mapNpmSearchResponse(payload, offset, size);
}
