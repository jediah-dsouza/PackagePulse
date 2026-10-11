# PackagePulse --- Technical Requirements Document (TRD)

## 1. Technical objectives

Build a client-rendered React application that consumes the public npm
Registry API through a small typed service boundary. Keep the
implementation frontend-only, with no backend or credentials. Favor
native platform APIs and the smallest set of dependencies that satisfies
the requirements.

## 2. Required stack

-   React
-   TypeScript with strict type checking
-   Vite
-   Tailwind CSS
-   React Router
-   Native `fetch`
-   Lucide icons
-   `localStorage` for saved packages and comparison selection where
    appropriate
-   Vitest + React Testing Library
-   Browser end-to-end tooling if available in the project environment

Do not add a global state library, data-fetching framework, chart
library, animation library or UI component framework without a
documented need. Prefer CSS transitions and native fetch first.

## 3. Proposed architecture

``` text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx (only if needed)
  components/
    ui/
    layout/
  features/
    search/
    package-detail/
    comparison/
    saved/
  services/
    npmRegistry/
      npmRegistryClient.ts
      npmRegistryService.ts
      schemas.ts
      mapPackageMetadata.ts
  hooks/
  lib/
    storage.ts
    url.ts
    date.ts
  types/
  styles/
  test/
```

Use feature folders when they make ownership clearer. Do not create
empty abstractions or wrapper components without a meaningful
responsibility.

### Dependency direction

``` text
Pages / feature UI
      ↓
Feature hooks and view models
      ↓
npmRegistryService + storage adapter
      ↓
Native fetch / browser storage
```

UI components must not construct ad hoc API URLs or parse raw registry
JSON. All remote access belongs behind the service boundary.

## 4. API integration

Primary base URL: `https://registry.npmjs.org`

Likely endpoints (confirm exact response shapes against current npm
Registry documentation before implementation): - Search:
`/-/v1/search?text=<encoded-query>&size=<page-size>&from=<offset>` -
Package metadata: `/<encoded-package-name>`; scoped names must be
encoded safely while preserving endpoint semantics. - Version manifest:
package metadata's `versions` map and `time` map may supply
version/publication information. - Weekly download counts are not
guaranteed to be in package metadata. If implemented, use the
appropriate public npm downloads endpoint and clearly identify the
period. Do not label a value "weekly downloads" unless the requested
period is exactly seven days and the response is valid.

Important: API response shapes and limits can change. Implement against
official docs and defensive runtime parsing, not assumptions copied from
a single sample response.

### Search result fields

Normalize only fields needed by the UI, such as: - `name` - `version` -
`description` - `keywords` - `date` / publication metadata if present -
`links.repository`, `links.homepage`, `links.npm` - `license` when
supplied by result/metadata - `score` only if useful and labeled as
registry search relevance, never as package quality.

### Package metadata fields

-   Package name and description
-   `dist-tags.latest`
-   Latest version manifest, if available
-   License field(s), without legal interpretation
-   Repository, homepage and npm links
-   Keywords
-   Maintainer names only if product scope explicitly needs them; avoid
    unnecessary personal-data display.
-   Dependencies and optional peer/optional dependency groups if
    available
-   Version publication timestamps from `time`
-   Release history only where timestamps are actually supplied.

### Download counts

If downloads are shown, implement a separate typed endpoint adapter.
State the time window and handle endpoint failures independently from
package metadata. A download-count failure must not make the entire
package detail page fail.

## 5. Typed domain model

Define normalized frontend types. Example contract (adapt based on
verified endpoint fields):

``` ts
type Availability<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; reason: "not-provided" | "not-returned" | "request-failed" };

type PackageSummary = {
  name: string;
  description?: string;
  latestVersion?: string;
  keywords: string[];
  license?: string;
  lastPublishedAt?: string;
  repositoryUrl?: string;
  homepageUrl?: string;
  npmUrl: string;
};

type PackageDetails = PackageSummary & {
  versions: Array<{
    version: string;
    publishedAt?: string;
    license?: string;
    dependencyCount?: number;
    dependencies?: Record<string, string>;
  }>;
  latestDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type SearchPage = {
  items: PackageSummary[];
  total?: number;
  offset: number;
  size: number;
  hasMore: boolean;
};

type DownloadMetric = {
  periodStart: string;
  periodEnd: string;
  downloads: number;
  source: "npm-downloads";
};

type ApiErrorCode =
  | "network"
  | "not-found"
  | "rate-limited"
  | "server"
  | "invalid-response"
  | "aborted"
  | "unknown";
```

Do not use `any`. Prefer `unknown` at the network boundary and
validate/map to trusted internal types. Avoid storing raw API payloads
in component state unless necessary.

## 6. Service contract

Example conceptual functions: -
`searchPackages(query, options, signal): Promise<SearchPage>` -
`getPackageDetails(packageName, signal): Promise<PackageDetails>` -
`getPackageDownloads(packageName, period, signal): Promise<DownloadMetric>`
if downloads are in scope. -
`getPackageVersion(packageName, version, signal): Promise<VersionDetails>`
only if a separate version endpoint is required.

Service responsibilities: - URL construction and encoding. - `fetch`
request and abort-signal support. - HTTP status mapping. - Runtime
response validation. - Normalization to domain types. - Consistent error
types/messages. - No UI-specific strings except where error codes need
user-friendly mapping.

UI responsibilities: - Loading, error, empty and retry presentation. -
Cancellation lifecycle. - Search debounce. - Sorting/filtering on
normalized data where appropriate. - User actions, routing and feedback.

## 7. Network reliability and race conditions

-   Use `AbortController` for superseded search requests and
    route-unmount requests.
-   Treat aborts as expected cancellation, not user-facing failures.
-   Debounce text search (suggested 300ms); Enter submits immediately.
-   Ignore responses whose query/request identity no longer matches
    current state.
-   Distinguish HTTP 404, 429, 5xx, network failure and invalid
    JSON/shape.
-   Avoid retry loops. Offer explicit retry and optional bounded retry
    only for transient failures.
-   If using browser cache, keep behavior simple and documented; never
    claim data is real-time if cached.
-   Preserve successful metadata if an independent downloads request
    fails.

## 8. State model

Keep state local unless multiple distant routes genuinely share it: -
Search query, filters and sort: URL state plus local input state as
needed. - Search request status and result page: search feature state. -
Package detail request status: detail feature state. - Comparison
selection: shared context or storage-backed hook only if several routes
need it. - Saved package IDs: storage adapter plus shared hook/context
for header count and saved page. - Derived values (counts, filtered
lists, availability) should be computed rather than duplicated in state.

Represent asynchronous UI states explicitly,
e.g. `idle | loading | success | empty | error`, or a discriminated
union. Avoid many loosely related booleans that can create impossible
combinations.

## 9. Local storage

Storage keys must be namespaced and versioned, e.g.: -
`packagepulse:saved:v1` - `packagepulse:compare:v1`

Store package names and small user-owned state only. On read: 1. Wrap
`getItem` and `JSON.parse` in safe error handling. 2. Validate schema
and allowed value types. 3. Deduplicate names. 4. Drop malformed entries
safely. 5. Continue in memory if storage is blocked. 6. Avoid throwing
during rendering.

No secrets, tokens or personal data should be stored.

## 10. Routing and URL handling

-   Use React Router.
-   Search state should be shareable with query parameters
    (`/explore?q=react`).
-   Scoped package names need robust route encoding/decoding. Test
    `@scope/name`, punctuation and malformed path segments.
-   Validate external links; allow `https:` and, where necessary,
    `http:` only. Reject `javascript:`, `data:` and other unexpected
    protocols.
-   Use safe external link attributes (`rel="noopener noreferrer"` when
    opening a new tab).
-   Unknown routes render a not-found page.
-   Avoid leaking raw API errors to users; log only safe diagnostic
    context in development.

## 11. Design and CSS implementation

-   Use Tailwind with a small set of CSS variables/tokens for semantic
    colors and surfaces.
-   Keep focus-visible, reduced-motion, disabled, loading and selected
    states consistent.
-   Use CSS Grid/Flexbox; avoid absolute positioning as a layout
    substitute.
-   Prefer lightweight CSS transitions. No mandatory animation
    dependency.
-   Avoid giant dependency additions, duplicated design primitives and
    one-off arbitrary values.
-   Make the layout work at mobile, tablet, laptop and wide desktop
    sizes.

## 12. Security and privacy requirements

-   No frontend secrets or private API keys.
-   No executing package code, rendering raw package README HTML
    unsanitized, or using `dangerouslySetInnerHTML` for registry
    content.
-   Treat all registry strings and URLs as untrusted input.
-   Render descriptions as text, validate external URL protocols, and
    avoid unsafe HTML.
-   Avoid collecting personal data and avoid analytics by default.
-   Use a dependency audit as one signal, not as proof of security.
-   Do not infer authorization/security boundaries from client code;
    this is a public, read-only frontend.
-   Do not make package-security claims from version, download or
    publication metadata.

## 13. Test strategy

### Unit

-   URL construction and scoped package encoding.
-   Runtime mapping of complete, partial, malformed and missing-field
    responses.
-   Error-code mapping.
-   Date formatting and unavailable-value rendering.
-   Storage schema validation and corruption recovery.

### Component

-   Search input, debounce, Enter submit and clear behavior.
-   Skeleton, empty, error and retry states.
-   Save/unsave and compare add/remove interactions.
-   Comparison table semantics and unavailable fields.
-   Keyboard menus/dialogs and accessible labels.

### Integration

-   Search → result → detail route.
-   Detail → compare tray → comparison page.
-   Save → refresh → saved page.
-   Partial comparison failure.
-   Query change during an in-flight request.

### End-to-end

-   Search a known package such as `react`.
-   Search with no results and invalid/unusual input.
-   Open package detail, inspect metadata and retry an error.
-   Compare two and three packages.
-   Save, refresh, remove.
-   Complete primary flows with keyboard.
-   Test offline/network-failure simulation if tooling supports it.

Use deterministic mocked API responses in tests. Do not rely on live npm
availability for every automated test.

## 14. Performance requirements

-   Debounce search and cancel stale requests.
-   Keep list rendering simple; add virtualization only if measured
    result volume warrants it.
-   Avoid fetching full metadata for every search result.
-   Lazy-load detail-only UI only if bundle measurements justify it.
-   Avoid layout shifts by reserving skeleton dimensions.
-   Use system fallback fonts if remote font loading is slow or
    unavailable.
-   Check production bundle and browser Network/Performance panels
    before adding optimization complexity.

## 15. Quality gates

Required commands should be documented and runnable (actual scripts may
vary): - typecheck - lint - unit/component tests - production build -
end-to-end smoke tests where configured - dependency audit - visual QA
at agreed viewport sizes

A passing build alone is not acceptance. Review browser console, network
requests, responsive behavior, keyboard access and all important state
branches.

## 16. Environment and deployment

-   No API key is expected for public npm endpoints.
-   Environment variables should only contain public configuration,
    never secrets.
-   Deployment must support client-side route fallback for React Router.
-   Document base-path considerations if deployed under a project
    subpath.
-   Verify direct navigation and refresh on `/package/react`,
    `/explore?q=react`, `/compare` and `/saved`.
