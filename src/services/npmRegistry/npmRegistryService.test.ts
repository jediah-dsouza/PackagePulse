import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildNpmPackageMetadataUrl,
  buildNpmPackageVersionUrl,
  buildNpmSearchUrl,
  getNpmPackageDetails,
  getNpmPackageVersionDetails,
  mapNpmPackageDetailsResponse,
  mapNpmPackageVersionResponse,
  mapNpmSearchResponse,
  MAX_DEPENDENCIES_PER_GROUP,
  MAX_DEPENDENCY_RANGE_LENGTH,
  MAX_PACKAGE_DESCRIPTION_LENGTH,
  MAX_PACKAGE_KEYWORDS,
  MAX_PACKAGE_KEYWORD_LENGTH,
  MAX_PACKAGE_KEYWORD_ENTRIES_SCANNED,
  MAX_PACKAGE_VERSIONS,
  MAX_PACKAGE_METADATA_BYTES,
  MAX_PACKAGE_VERSION_BYTES,
  searchNpmPackages,
} from "./npmRegistryService";
import { NpmRegistryError, RegistrySearchError } from "./types";

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildNpmSearchUrl", () => {
  it("safely encodes scoped names and unusual query punctuation", () => {
    const url = buildNpmSearchUrl("  @scope/ui kit +test  ", {
      offset: 40,
      size: 15,
    });

    expect(url.origin + url.pathname).toBe("https://registry.npmjs.org/-/v1/search");
    expect(url.searchParams.get("text")).toBe("@scope/ui kit +test");
    expect(url.searchParams.get("from")).toBe("40");
    expect(url.searchParams.get("size")).toBe("15");
    expect(url.href).toContain("%40scope%2Fui+kit+%2Btest");
  });

  it("normalizes invalid pagination values to safe bounds", () => {
    const url = buildNpmSearchUrl("react", {
      offset: -10,
      size: 5000,
    });

    expect(url.searchParams.get("from")).toBe("0");
    expect(url.searchParams.get("size")).toBe("250");
  });
});

describe("mapNpmSearchResponse", () => {
  it("maps the npm search response and skips malformed individual records", () => {
    const result = mapNpmSearchResponse(
      {
        total: 45,
        objects: [
          {
            package: {
              name: "react",
              version: "19.3.0",
              description: "A UI library",
              keywords: ["ui", "react", "ui", 12],
              date: "2026-09-09T17:21:30.071Z",
              license: "MIT",
              links: {
                repository: "git+https://github.com/react/react.git",
                homepage: "https://react.dev/",
                npm: "https://attacker.example/imitate-npm",
              },
            },
          },
          { package: { name: "   ", version: "1.0.0" } },
          { malformed: true },
        ],
      },
      20,
      20,
    );

    expect(result).toMatchObject({
      total: 45,
      offset: 20,
      size: 20,
      nextOffset: 23,
      hasMore: true,
      items: [
        {
          name: "react",
          latestVersion: "19.3.0",
          description: "A UI library",
          keywords: ["ui", "react"],
          publishedAt: "2026-09-09T17:21:30.071Z",
          license: "MIT",
          repositoryUrl: "https://github.com/react/react.git",
          homepageUrl: "https://react.dev/",
          npmUrl: "https://www.npmjs.com/package/react",
        },
      ],
    });
  });

  it("accepts partial metadata without inventing missing fields", () => {
    const result = mapNpmSearchResponse(
      {
        total: 1,
        objects: [{ package: { name: "@scope/minimal", keywords: [] } }],
      },
      0,
      20,
    );

    expect(result.items[0]).toEqual({
      name: "@scope/minimal",
      keywords: [],
      description: undefined,
      latestVersion: undefined,
      publishedAt: undefined,
      license: undefined,
      repositoryUrl: undefined,
      homepageUrl: undefined,
      npmUrl: "https://www.npmjs.com/package/@scope/minimal",
    });
    expect(result.hasMore).toBe(false);
  });

  it("skips registry names that are unsafe to use in routes or install commands", () => {
    expect(() =>
      mapNpmSearchResponse(
        {
          objects: [{ package: { name: "react;rm-rf", version: "1.0.0" } }],
        },
        0,
        20,
      ),
    ).toThrow(RegistrySearchError);
  });

  it("drops unsafe URLs and invalid dates from untrusted metadata", () => {
    const result = mapNpmSearchResponse(
      {
        objects: [
          {
            package: {
              name: "url-test",
              date: "not a date",
              keywords: "not-an-array",
              links: {
                homepage: "javascript:alert(1)",
                repository: "https://user:password@example.com/repo",
              },
            },
          },
        ],
      },
      0,
      20,
    );

    expect(result.items[0]).toMatchObject({
      name: "url-test",
      keywords: [],
    });
    expect(result.items[0]?.publishedAt).toBeUndefined();
    expect(result.items[0]?.homepageUrl).toBeUndefined();
    expect(result.items[0]?.repositoryUrl).toBeUndefined();
  });

  it.each([
    ["misleading host", "https://attacker.example/package/claimed"],
    ["javascript protocol", "javascript:alert(1)"],
    ["credential URL", "https://user:password@www.npmjs.com/package/claimed"],
  ])("uses the canonical npm page for %s metadata", (_label, npmLink) => {
    const result = mapNpmSearchResponse(
      {
        objects: [
          {
            package: {
              name: "@types/node",
              links: { npm: npmLink },
            },
          },
        ],
      },
      0,
      20,
    );

    expect(result.items[0]?.npmUrl).toBe("https://www.npmjs.com/package/@types/node");
  });

  it("rejects more search results than the requested page size", () => {
    const objects = Array.from({ length: 21 }, (_, index) => ({
      package: { name: `package-${index}` },
    }));

    let caught: unknown;
    try {
      mapNpmSearchResponse({ objects }, 0, 20);
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({ code: "invalid-response" });
  });

  it("bounds long descriptions, keyword collections, individual keywords, URLs, and licenses", () => {
    const longDescription = "d".repeat(MAX_PACKAGE_DESCRIPTION_LENGTH + 30);
    const keywords = Array.from(
      { length: MAX_PACKAGE_KEYWORDS + 2 },
      (_, index) => `keyword-${index}`,
    );
    keywords[0] = "k".repeat(MAX_PACKAGE_KEYWORD_LENGTH + 1);
    const result = mapNpmSearchResponse(
      {
        objects: [
          {
            package: {
              name: "bounded-fields",
              description: longDescription,
              keywords,
              license: "L".repeat(1_000),
              links: {
                homepage: `https://example.test/${"x".repeat(3_000)}`,
              },
            },
          },
        ],
      },
      0,
      20,
    );

    expect(result.items[0]?.description).toHaveLength(MAX_PACKAGE_DESCRIPTION_LENGTH);
    expect(result.items[0]?.description).toMatch(/…$/);
    expect(result.items[0]?.descriptionTruncated).toBe(true);
    expect(result.items[0]?.keywords).toHaveLength(MAX_PACKAGE_KEYWORDS);
    expect(result.items[0]?.keywordsTruncated).toBe(true);
    expect(result.items[0]?.keywords).not.toContain("k".repeat(129));
    expect(result.items[0]?.license).toBeUndefined();
    expect(result.items[0]?.homepageUrl).toBeUndefined();
  });

  it.each([
    [
      "duplicate entries",
      [
        ...Array.from({ length: MAX_PACKAGE_KEYWORD_ENTRIES_SCANNED }, () => "same"),
        "later",
      ],
      ["same"],
    ],
    [
      "invalid entries",
      [
        ...Array.from({ length: MAX_PACKAGE_KEYWORD_ENTRIES_SCANNED }, () => 42),
        "later",
      ],
      [],
    ],
    [
      "overlong entries",
      [
        ...Array.from({ length: MAX_PACKAGE_KEYWORD_ENTRIES_SCANNED }, () =>
          "k".repeat(MAX_PACKAGE_KEYWORD_LENGTH + 1),
        ),
        "later",
      ],
      [],
    ],
  ])(
    "caps raw keyword scanning before deduplication/filtering of %s",
    (_label, raw, retained) => {
      const result = mapNpmSearchResponse(
        {
          objects: [{ package: { name: "keyword-scan-bound", keywords: raw } }],
        },
        0,
        20,
      );

      expect(result.items[0]?.keywords).toEqual(retained);
      expect(result.items[0]?.keywordsTruncated).toBe(true);
    },
  );

  it("checks oversized raw fields early while preserving valid padded Registry values", () => {
    const result = mapNpmSearchResponse(
      {
        objects: [
          {
            package: {
              name: "  padded-package  ",
              version: " 1.2.3 ",
              description: "  A short description.  ",
              keywords: ["  ui  "],
              license: " MIT ",
              date: " 2025-01-12T00:00:00.000Z ",
              links: { homepage: " https://example.test/package " },
            },
          },
          {
            package: {
              name: "oversized-fields",
              version: "v".repeat(129),
              description: "d".repeat(MAX_PACKAGE_DESCRIPTION_LENGTH + 20),
              license: "L".repeat(257),
              date: "2".repeat(65),
              links: { homepage: `https://example.test/${"x".repeat(2_050)}` },
            },
          },
        ],
      },
      0,
      20,
    );

    expect(result.items[0]).toMatchObject({
      name: "padded-package",
      latestVersion: "1.2.3",
      description: "A short description.",
      keywords: ["ui"],
      license: "MIT",
      publishedAt: "2025-01-12T00:00:00.000Z",
      homepageUrl: "https://example.test/package",
    });
    expect(result.items[1]).toMatchObject({
      name: "oversized-fields",
      latestVersion: undefined,
      license: undefined,
      publishedAt: undefined,
      homepageUrl: undefined,
      descriptionTruncated: true,
    });
  });

  it("accepts an empty result set and rejects malformed response shapes", () => {
    expect(mapNpmSearchResponse({ total: 0, objects: [] }, 0, 20)).toMatchObject({
      items: [],
      total: 0,
      hasMore: false,
    });
    expect(() => mapNpmSearchResponse({ total: 2 }, 0, 20)).toThrow(
      RegistrySearchError,
    );
    expect(() =>
      mapNpmSearchResponse({ objects: [{ package: { name: null } }] }, 0, 20),
    ).toThrow(RegistrySearchError);
  });
});

describe("searchNpmPackages", () => {
  it("does not send an empty query", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(searchNpmPackages("   ")).resolves.toMatchObject({
      items: [],
      total: 0,
      hasMore: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches and maps a successful page", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        total: 1,
        objects: [{ package: { name: "react", version: "19.3.0" } }],
      }),
    );

    const page = await searchNpmPackages("react");

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [input, init] = fetchSpy.mock.calls[0] ?? [];
    expect(new URL(String(input)).searchParams.get("text")).toBe("react");
    expect(init?.headers).toEqual({ Accept: "application/json" });
    expect(page.items[0]?.name).toBe("react");
  });

  it("maps HTTP 429 and Retry-After", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "retry-after": "12" },
      }),
    );

    await expect(searchNpmPackages("react")).rejects.toMatchObject({
      code: "rate-limited",
      retryAfterSeconds: 12,
    });
  });

  it("distinguishes network failure, server errors, and malformed JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("offline"));
    await expect(searchNpmPackages("react")).rejects.toMatchObject({
      code: "network",
    });

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(null, { status: 503 }),
    );
    await expect(searchNpmPackages("react")).rejects.toMatchObject({
      code: "server",
    });

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response("{", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(searchNpmPackages("react")).rejects.toMatchObject({
      code: "invalid-response",
    });
  });

  it("maps an aborted fetch as an expected cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );

    await expect(
      searchNpmPackages("react", { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "aborted" });
  });
});

function packagePackument(name = "@scope/widget") {
  return {
    name,
    description: "A package record for testing.",
    "dist-tags": { latest: "2.0.0" },
    time: {
      created: "2024-01-01T00:00:00.000Z",
      modified: "2026-06-01T00:00:00.000Z",
      "1.0.0": "2024-02-01T00:00:00.000Z",
      "2.0.0": "2025-10-01T00:00:00.000Z",
    },
    versions: {
      "1.0.0": {
        name,
        version: "1.0.0",
        dependencies: { alpha: "^1.2.0" },
      },
      "2.0.0": {
        name,
        version: "2.0.0",
        keywords: ["widgets", "testing"],
        license: "MIT",
        repository: { type: "git", url: "git+https://github.com/example/widget.git" },
        homepage: "https://example.test/widget",
        dependencies: { beta: "~3.0.0" },
        peerDependencies: { react: "^19.0.0" },
        optionalDependencies: { "optional-addon": ">=1" },
      },
    },
  };
}

function versionManifest(
  name: string,
  version: string,
  extras: Record<string, unknown> = {},
) {
  return { name, version, ...extras };
}

describe("package metadata URL construction and mapping", () => {
  it("encodes scoped package names and version identifiers as path segments", () => {
    expect(buildNpmPackageMetadataUrl("@types/node").href).toBe(
      "https://registry.npmjs.org/%40types%2Fnode",
    );
    expect(buildNpmPackageVersionUrl("@types/node", "20.0.1-beta.1+meta").href).toBe(
      "https://registry.npmjs.org/%40types%2Fnode/20.0.1-beta.1%2Bmeta",
    );
    expect(() => buildNpmPackageMetadataUrl("invalid/name")).toThrow(NpmRegistryError);
    expect(() => buildNpmPackageVersionUrl("react", "../latest")).toThrow(
      NpmRegistryError,
    );
  });

  it("maps complete package metadata, dependencies, safe links, and dated releases", () => {
    const details = mapNpmPackageDetailsResponse(packagePackument(), "@scope/widget");

    expect(details).toMatchObject({
      name: "@scope/widget",
      description: "A package record for testing.",
      latestVersion: "2.0.0",
      publishedAt: "2025-10-01T00:00:00.000Z",
      keywords: ["widgets", "testing"],
      license: "MIT",
      repositoryUrl: "https://github.com/example/widget.git",
      homepageUrl: "https://example.test/widget",
      npmUrl: "https://www.npmjs.com/package/@scope/widget",
      metadataMode: "full",
      releaseHistory: {
        status: "available",
        publicationDatesAvailable: true,
        versions: [
          { version: "2.0.0", publishedAt: "2025-10-01T00:00:00.000Z" },
          { version: "1.0.0", publishedAt: "2024-02-01T00:00:00.000Z" },
        ],
      },
      latestVersionDetails: {
        version: "2.0.0",
        license: "MIT",
        dependencyGroups: [
          {
            kind: "dependencies",
            status: "available",
            items: [{ name: "beta", range: "~3.0.0" }],
          },
          {
            kind: "peerDependencies",
            status: "available",
            items: [{ name: "react", range: "^19.0.0" }],
          },
          {
            kind: "optionalDependencies",
            status: "available",
            items: [{ name: "optional-addon", range: ">=1" }],
          },
        ],
      },
    });
  });

  it("marks release history unavailable when the version collection exceeds its cap", () => {
    const versions = Object.fromEntries(
      Array.from({ length: MAX_PACKAGE_VERSIONS + 1 }, (_, index) => {
        const version = `1.0.${index}`;
        return [version, { name: "bounded-package", version }];
      }),
    );
    const latestVersion = `1.0.${MAX_PACKAGE_VERSIONS}`;
    const details = mapNpmPackageDetailsResponse(
      {
        name: "bounded-package",
        "dist-tags": { latest: latestVersion },
        versions,
      },
      "bounded-package",
    );

    expect(details.releaseHistory).toEqual({
      status: "unavailable",
      reason: "too-many-versions",
    });
    expect(details.latestVersion).toBe(latestVersion);
    expect(details.latestVersionDetails?.version).toBe(latestVersion);
  });

  it("limits dependency collections and marks the group partial", () => {
    const dependencies = Object.fromEntries(
      Array.from({ length: MAX_DEPENDENCIES_PER_GROUP + 1 }, (_, index) => [
        `dep-${String(index).padStart(4, "0")}`,
        "^1.0.0",
      ]),
    );
    const details = mapNpmPackageDetailsResponse(
      {
        name: "dependency-heavy",
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": {
            name: "dependency-heavy",
            version: "1.0.0",
            dependencies,
          },
        },
      },
      "dependency-heavy",
    );
    const dependencyGroup = details.latestVersionDetails?.dependencyGroups[0];

    expect(dependencyGroup?.items).toHaveLength(MAX_DEPENDENCIES_PER_GROUP);
    expect(dependencyGroup).toMatchObject({
      status: "partial",
      omittedByLimit: true,
    });
  });

  it("checks raw dependency-range length before trimming and preserves padded valid ranges", () => {
    const paddedValidRange = `${" ".repeat(10)}${"x".repeat(MAX_DEPENDENCY_RANGE_LENGTH)}${" ".repeat(10)}`;
    const overlongRange = `${" ".repeat(10)}${"x".repeat(MAX_DEPENDENCY_RANGE_LENGTH + 1)}${" ".repeat(10)}`;
    const details = mapNpmPackageDetailsResponse(
      {
        name: "range-boundary",
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": {
            name: "range-boundary",
            version: "1.0.0",
            dependencies: {
              "padded-range": paddedValidRange,
              "overlong-range": overlongRange,
            },
          },
        },
      },
      "range-boundary",
    );
    const dependencyGroup = details.latestVersionDetails?.dependencyGroups[0];

    expect(dependencyGroup).toMatchObject({
      status: "partial",
      items: [{ name: "padded-range", range: "x".repeat(MAX_DEPENDENCY_RANGE_LENGTH) }],
    });
  });

  it("bounds long package-detail descriptions, keywords, and external links", () => {
    const details = mapNpmPackageDetailsResponse(
      {
        name: "long-metadata",
        description: "d".repeat(MAX_PACKAGE_DESCRIPTION_LENGTH + 10),
        keywords: ["ui", "k".repeat(MAX_PACKAGE_KEYWORD_LENGTH + 1)],
        homepage: `https://example.test/${"x".repeat(3_000)}`,
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": {
            name: "long-metadata",
            version: "1.0.0",
          },
        },
      },
      "long-metadata",
    );

    expect(details.description).toHaveLength(MAX_PACKAGE_DESCRIPTION_LENGTH);
    expect(details.descriptionTruncated).toBe(true);
    expect(details.keywords).toEqual(["ui"]);
    expect(details.keywordsTruncated).toBe(true);
    expect(details.homepageUrl).toBeUndefined();
  });

  it("keeps partial fields unavailable and distinguishes an empty dependency set", () => {
    const details = mapNpmPackageDetailsResponse(
      {
        name: "minimal-package",
        "dist-tags": { latest: "1.0.0" },
        versions: {
          "1.0.0": { name: "minimal-package", version: "1.0.0" },
        },
      },
      "minimal-package",
    );

    expect(details).toMatchObject({
      name: "minimal-package",
      description: undefined,
      latestVersion: "1.0.0",
      license: undefined,
      homepageUrl: undefined,
      repositoryUrl: undefined,
      keywords: [],
      publishedAt: undefined,
      releaseHistory: {
        status: "available",
        publicationDatesAvailable: false,
        versions: [{ version: "1.0.0", publishedAt: undefined }],
      },
      latestVersionDetails: {
        dependencyGroups: [
          { kind: "dependencies", status: "available", items: [] },
          { kind: "peerDependencies", status: "available", items: [] },
          { kind: "optionalDependencies", status: "available", items: [] },
        ],
      },
    });
  });

  it("marks omitted version lists unavailable rather than as an empty history", () => {
    const details = mapNpmPackageDetailsResponse(
      { name: "partial", description: "Partial record." },
      "partial",
    );

    expect(details.releaseHistory).toEqual({
      status: "unavailable",
      reason: "not-provided",
    });
    expect(details.latestVersion).toBeUndefined();
  });

  it("drops unsafe external URLs and reports malformed dependency groups honestly", () => {
    const details = mapNpmPackageDetailsResponse(
      {
        name: "unsafe-link-package",
        "dist-tags": { latest: "1.0.0" },
        homepage: "javascript:alert(1)",
        repository: "https://user:secret@example.test/private",
        versions: {
          "1.0.0": {
            name: "unsafe-link-package",
            version: "1.0.0",
            dependencies: { react: "^19", "bad/name": "1.0.0" },
            peerDependencies: "not-an-object",
          },
        },
      },
      "unsafe-link-package",
    );

    expect(details.homepageUrl).toBeUndefined();
    expect(details.repositoryUrl).toBeUndefined();
    expect(details.npmUrl).toBe("https://www.npmjs.com/package/unsafe-link-package");
    expect(details.latestVersionDetails?.dependencyGroups).toMatchObject([
      {
        kind: "dependencies",
        status: "partial",
        items: [{ name: "react", range: "^19" }],
      },
      { kind: "peerDependencies", status: "unavailable", items: [] },
      { kind: "optionalDependencies", status: "available", items: [] },
    ]);
  });

  it("rejects malformed packuments and version manifests", () => {
    expect(() => mapNpmPackageDetailsResponse({ versions: null }, "react")).toThrow(
      NpmRegistryError,
    );
    expect(() =>
      mapNpmPackageDetailsResponse({ name: "different-name" }, "react"),
    ).toThrow(NpmRegistryError);
    expect(() =>
      mapNpmPackageVersionResponse(
        { name: "react", version: "2.0.0" },
        "react",
        "1.0.0",
      ),
    ).toThrow(NpmRegistryError);
  });
});

describe("getNpmPackageDetails", () => {
  it("requests the full metadata endpoint and returns the latest version record", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(packagePackument()));

    const details = await getNpmPackageDetails("@scope/widget");

    expect(details.latestVersion).toBe("2.0.0");
    expect(details.latestVersionDetails?.dependencyGroups[0]?.items).toEqual([
      { name: "beta", range: "~3.0.0" },
    ]);
    const [input, init] = fetchSpy.mock.calls[0] ?? [];
    expect(String(input)).toBe("https://registry.npmjs.org/%40scope%2Fwidget");
    expect(init?.headers).toEqual({ Accept: "application/json" });
  });

  it("uses a reduced response after a full packument crosses the byte ceiling", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: { "content-length": String(MAX_PACKAGE_METADATA_BYTES + 1) },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            name: "@types/node",
            "dist-tags": { latest: "26.0.0" },
            versions: {
              "25.0.0": { name: "@types/node", version: "25.0.0" },
              "26.0.0": { name: "@types/node", version: "26.0.0" },
            },
          },
          200,
          { "content-type": "application/vnd.npm.install-v1+json" },
        ),
      );

    const details = await getNpmPackageDetails("@types/node");

    expect(details).toMatchObject({
      name: "@types/node",
      latestVersion: "26.0.0",
      metadataMode: "abbreviated",
      releaseHistory: {
        status: "available",
        publicationDatesAvailable: false,
        versions: [{ version: "26.0.0" }, { version: "25.0.0" }],
      },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1]?.[1]?.headers).toEqual({
      Accept: "application/vnd.npm.install-v1+json",
    });
    expect(details.latestVersionDetails).toBeUndefined();
  });

  it("cancels an oversized chunked response and falls back without buffering it all", async () => {
    let cancelled = false;
    const oversizedStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(MAX_PACKAGE_METADATA_BYTES + 1));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(oversizedStream, { status: 200 }))
      .mockResolvedValueOnce(
        jsonResponse({
          name: "large-package",
          "dist-tags": { latest: "1.0.0" },
          versions: { "1.0.0": { name: "large-package", version: "1.0.0" } },
        }),
      );

    const details = await getNpmPackageDetails("large-package");

    expect(cancelled).toBe(true);
    expect(details.metadataMode).toBe("abbreviated");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("uses only the latest manifest if both package-level responses exceed the cap", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: { "content-length": String(MAX_PACKAGE_METADATA_BYTES + 1) },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 200,
          headers: { "content-length": String(MAX_PACKAGE_METADATA_BYTES + 1) },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          versionManifest("huge-package", "3.0.0", {
            description: "Latest-only fallback.",
            dependencies: { react: "^19" },
          }),
        ),
      );

    const details = await getNpmPackageDetails("huge-package");

    expect(details).toMatchObject({
      latestVersion: "3.0.0",
      description: "Latest-only fallback.",
      metadataMode: "latest-only",
      releaseHistory: { status: "unavailable", reason: "response-too-large" },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(String(fetchSpy.mock.calls[2]?.[0])).toBe(
      "https://registry.npmjs.org/huge-package/latest",
    );
  });

  it("rejects a selected-version manifest above 2 MiB and cancels its stream", async () => {
    let pulledChunks = 0;
    let cancelled = false;
    const oversizedStream = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulledChunks += 1;
          if (pulledChunks === 1) {
            controller.enqueue(new Uint8Array(MAX_PACKAGE_VERSION_BYTES - 1));
            return;
          }
          controller.enqueue(new Uint8Array(2));
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(oversizedStream, { status: 200 }),
    );

    await expect(
      getNpmPackageVersionDetails("large-package", "1.0.0"),
    ).rejects.toMatchObject({
      code: "too-large",
      limitBytes: MAX_PACKAGE_VERSION_BYTES,
    });
    expect(cancelled).toBe(true);
    expect(pulledChunks).toBe(2);
  });

  it("returns an actionable too-large error when the latest-only fallback exceeds 2 MiB", async () => {
    const oversized = (limit: number) =>
      new Response(null, {
        status: 200,
        headers: { "content-length": String(limit + 1) },
      });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(oversized(MAX_PACKAGE_METADATA_BYTES))
      .mockResolvedValueOnce(oversized(MAX_PACKAGE_METADATA_BYTES))
      .mockResolvedValueOnce(oversized(MAX_PACKAGE_VERSION_BYTES));

    await expect(getNpmPackageDetails("huge-package")).rejects.toMatchObject({
      code: "too-large",
      limitBytes: MAX_PACKAGE_VERSION_BYTES,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(String(fetchSpy.mock.calls[2]?.[0])).toBe(
      "https://registry.npmjs.org/huge-package/latest",
    );
  });

  it("distinguishes 404, rate-limit, malformed response, and network failures", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "7" },
        }),
      )
      .mockResolvedValueOnce(new Response("{", { status: 200 }))
      .mockRejectedValueOnce(new TypeError("offline"));

    await expect(getNpmPackageDetails("missing-package")).rejects.toMatchObject({
      code: "not-found",
    });
    await expect(getNpmPackageDetails("limited-package")).rejects.toMatchObject({
      code: "rate-limited",
      retryAfterSeconds: 7,
    });
    await expect(getNpmPackageDetails("malformed-package")).rejects.toMatchObject({
      code: "invalid-response",
    });
    await expect(getNpmPackageDetails("offline-package")).rejects.toMatchObject({
      code: "network",
    });
  });

  it("fetches one selected version record with the safe encoded URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        versionManifest("@types/node", "20.0.1", {
          dependencies: { undici: "^5.0.0" },
        }),
      ),
    );

    const details = await getNpmPackageVersionDetails("@types/node", "20.0.1");

    expect(details).toMatchObject({
      version: "20.0.1",
    });
    expect(details.dependencyGroups[0]).toMatchObject({
      kind: "dependencies",
      status: "available",
      items: [{ name: "undici", range: "^5.0.0" }],
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "https://registry.npmjs.org/%40types%2Fnode/20.0.1",
    );
  });
});
