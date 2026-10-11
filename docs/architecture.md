# PackagePulse architecture

## Direction

A task-first npm metadata workbench: midnight canvas, warm peach/coral accents, Exo 2 with fallback, code/package identifiers in a system monospace stack, and restrained border-led surfaces. The Home page introduces the tool; Explore prioritizes real Registry results and transparent missing data. No dashboard stat row, fake popularity/security claim, decorative chart, or nonfunctional action.

## App boundaries

- `src/app`: route table and application composition.
- `src/components/layout`: shell, responsive navigation, page container, footer, skip link, toast region.
- `src/components/ui`: small reusable UI primitives and notices.
- `src/features/search`: search request state, local result filtering/sorting, result rows, and search skeletons.
- `src/features/comparison`: validated selection context/storage, Explore/detail actions, the in-place Registry picker, and independent comparison-column loading/retry.
- `src/features/saved`: versioned names-only storage adapter, shared saved-state provider, Save/Remove controls, and Saved-page metadata cards using the existing Registry service.
- `src/services/npmRegistry`: npm Search API and package/version endpoint construction, bounded fetches, HTTP errors, runtime validation, and mapping into domain types.
- `src/features/packageDetail`: package detail request state, selected-version manifest loading/cache, release history, package facts, dependency groups, and install-command actions.
- `src/pages`: route-level orchestration; Explore synchronizes committed query/filter/sort state with the URL.
- `src/styles.css`: semantic CSS tokens and responsive styling.
- `src/test`: deterministic test setup.

## Search data flow

```text
Explore form / URL
        ↓
usePackageSearch (debounce is owned by the page; cancellation by the hook)
        ↓
searchNpmPackages
        ↓
GET https://registry.npmjs.org/-/v1/search?text=…&size=…&from=…
        ↓
unknown JSON → runtime validation → PackageSummary / RegistrySearchPage
        ↓
accessible loading, results, empty, error, retry, and load-more UI
```

Presentation components do not construct API URLs or parse npm response JSON. The service accepts `unknown` at the network boundary, skips invalid individual records, rejects malformed page shapes, maps HTTP/network failures into typed error codes, and accepts an `AbortSignal`. Only safe HTTP(S) external links and validated npm package names enter the domain model.

The URL stores the committed query as `q`; optional `keyword` and `sort` values are also shareable. Typing commits after 300 ms with history replacement; Enter submits immediately. Registry order is the default. Name and publication-date sorts operate only on loaded results. Keyword filtering matches an exact returned keyword among loaded results. Load more uses the API's `from`/`size` offsets and appends validated results.

Superseded requests are aborted and guarded by request identity. Retry is explicit. A rate-limit wait duration is shown when `Retry-After` is available to the browser; otherwise the UI gives a general wait-and-retry instruction.

## Package-detail data flow

```text
/package/:name (React Router-decoded name)
        ↓
usePackageDetails (abort + request identity; selected-version cache)
        ↓
getNpmPackageDetails / getNpmPackageVersionDetails
        ↓
GET https://registry.npmjs.org/{encodeURIComponent(name)}
GET https://registry.npmjs.org/{encodeURIComponent(name)}/{encodeURIComponent(version)}
        ↓
bounded unknown JSON → runtime validation → PackageDetails / PackageVersionDetails
        ↓
package facts, release history, selected-version dependency groups, copy-install action
```

The package service requests a full `application/json` packument and reads at
most 12 MiB. If that body exceeds the cap, it retries the same package endpoint
with npm's abbreviated `application/vnd.npm.install-v1+json` representation,
also capped at 12 MiB. If that is still too large, it requests only the
`latest` version manifest at `/{encodedName}/latest`, capped at 2 MiB; this
last fallback explicitly marks release history unavailable. A selected
non-latest version is fetched only when chosen, at its encoded version route,
with a 2 MiB cap. Oversized streamed bodies are cancelled once the cap is
crossed; a larger declared `Content-Length` is rejected before parsing.

The full packument's `name`, `description`, `dist-tags.latest`, `versions`,
`time`, and latest manifest fields supply displayed metadata. Release dates
come only from the `time` map; releases are ordered newest-first by timestamp,
with a numeric version fallback where a timestamp is absent. The detail view
does not request download counts, maintainer data, or README content. In
particular, README HTML is never rendered. External metadata links are accepted
only when they parse as credential-free HTTP(S) URLs no longer than 2,048
characters. Search-result npm destinations are generated from the validated
package name on `www.npmjs.com`; the Registry's `links.npm` value is ignored.

Mapped Registry values have additional display/work bounds: descriptions are
limited to 4,096 characters (with truncation disclosed); the mapper scans at
most 200 raw keyword entries and retains up to 100 unique terms of at most 128
characters each (omissions disclosed); dependency ranges are limited to 512
characters; licenses to 256 characters; and publication date strings to 64
characters. Search rejects a
response whose `objects` array exceeds the requested page size (maximum 250).
Release history is mapped up to 5,000 version entries; a larger map is marked
unavailable while the latest release can still be inspected. A dependency
group maps up to 2,000 entries; hitting that limit marks the group partial and
the detail view explains that further entries were omitted. These mapping
limits complement, but do not replace, the streamed 12 MiB packument and 2 MiB
search/version response body limits.

Each dependency group is represented as available, partial, or unavailable. A
valid manifest with an absent or empty dependency map is shown as having no
dependencies; an invalid or missing dependency map remains unavailable. The
dependency disclosure initially shows at most the first 40 returned names per
group, with an accessible Show all / Show less control when more are present.
Every validated entry retained under the 2,000-entry mapping cap remains
available in the expanded list; larger groups are labeled partial.
The selected version's manifest is cached in memory per detail route, up to
12 selected versions; it is not persisted to browser storage. Missing Registry
fields remain unavailable and are not treated as quality evidence.

## Package comparison

```text
Explore result / package detail / Compare picker
        ↓
CompareSelectionContext (unique validated names, maximum 3)
        ↔
localStorage["packagepulse:compare:v1"] (package identifiers only)
        ↓
ComparisonTable (independent per-package loading, error, and retry)
        ↓
getNpmPackageDetails → optional latest-version manifest request
        ↓
Accessible row/column-header table with explicit unavailable values
```

Comparison reuses the existing Registry service rather than adding another API
client. The selection reader validates stored JSON, discards invalid, duplicate,
and excess entries, and reports recovery. If storage is unavailable, selection
remains in memory for the current session and the UI warns that it may not survive
refresh. Each package column loads and retries independently, so a failed package
does not remove successful columns. If a full packument does not include the latest
version manifest, one bounded latest-version request is made for that package.

The table compares latest version, license, last publication, dependency
availability/count, repository, homepage, and keywords. An empty dependency map,
unavailable data, and failed requests are distinct. Weekly downloads are not
requested and are omitted. Differences are highlighted only to aid scanning; the
app does not declare a winner or assign quality, maintenance, or security scores.
Mobile and tablet layouts keep the accessible table intact in a labeled
horizontal-scroll region; desktop fits the selected columns when space allows.

## Saved-package data flow

```text
Explore result / package detail
        ↓
SavedPackageButton → SavedPackagesProvider
        ↔
localStorage["packagepulse:saved:v1"] ({ version: 1, names: [...] })
        ↓
SiteHeader count + /saved shortlist
        ↓
getNpmPackageDetails (existing npmRegistry service) → optional Registry metadata
```

The adapter stores only validated package identifiers. Reads catch blocked
storage and malformed JSON/schema; invalid and duplicate names are removed,
and a valid versioned record is rewritten when recovery is possible. Failed
writes leave the selection usable in memory for the current page session and
the Saved page displays a persistence warning. A browser `storage` event
updates open tabs. The shared toast region announces save/remove outcomes.

Saved cards fetch their own public Registry record through
`getNpmPackageDetails`; no API URL construction or raw response parsing is
performed in the page. Each card cancels its request when removed/unmounted,
shows an accessible loading state, and provides retry for transient failures.
A missing Registry package stays in the user's shortlist and links to its
detail route. Only available metadata is shown; the shortlist is not a trust,
quality, security, or maintenance signal.

## Route recovery and integration hardening

The top-level `RouteErrorBoundary` wraps a location-keyed error-boundary view.
When an uncaught route render error is caught, its fallback can navigate to
Explore; the location key remounts the boundary and clears the captured error.
Unknown routes use the separate 404 page and have a tested Explore recovery
link. Unit coverage intentionally throws inside a route to exercise the
boundary recovery path.

Search query/filter/sort state is URL-backed and verified after reload and
browser back/forward. Search requests abort on superseding input and guard
against late results; package detail/version hooks abort stale or unmounted
requests; comparison columns and saved cards retain independent loading and
retry states. Browser tests exercise a superseded search response, a partial
comparison failure, Registry rate limits, network/malformed detail failures,
retry, and real two-tab saved-state synchronization.

Registry text is rendered through normal React text nodes, never injected as
HTML. The service validates outbound metadata URLs before they reach links;
only credential-free HTTP(S) URLs are accepted. Toasts use a polite live
region, while actionable request failures and invalid routes use inline
alerts/statuses. Phase 6 route-shell verification checks six routes at 360,
768, and 1280 CSS pixels and runs Axe on 18 route/viewport pairs. Phase 7
adds success-state checks at 360, 390, 430, 768, 1024, 1280, and 1440
pixels, plus Axe checks for the mobile navigation dialog, detail loading,
Explore empty/rate-limit, detail 404, comparison partial-failure, and
Saved-empty states. Keyboard focus containment, reduced motion, 44px
targets, surface-border contrast, and local production-preview performance
are also covered; see `GATES.md` for exact evidence and limitations.

## Phase boundaries

- Phase 2 implements Registry search, discovery filters/sorts, pagination, and the result-row install-command copy action.
- The implementation plan also mentions compare/save result actions. The explicit Phase 2 authorization excluded comparison behavior and persistence, so those actions are intentionally omitted rather than represented by nonfunctional controls.
- Phase 3 implements read-only package details, release history, selected-version dependency metadata, package-name and install-command copy actions, and complete access to returned dependency entries.
- Phase 4 implements comparison selection and live comparison tables.
- Phase 5 implements names-only saved-package persistence and the Saved page; comparison behavior is unchanged.
- Phase 6 hardens recovery and cross-route behavior, with service, route-boundary, metadata-rendering, multi-tab, and viewport coverage.
- Phase 7 audits accessibility, responsive layouts, reduced motion, and production-build performance; its performance results are local synthetic measurements, not field data.
- No per-result downloads requests, package-quality scores, security claims, or automatic retries are made.
- npm search can return partial metadata. Missing values remain unavailable rather than being inferred.
