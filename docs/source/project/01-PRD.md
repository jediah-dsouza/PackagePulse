# PackagePulse --- Product Requirements Document (PRD)

**Status:** Build specification\
**Product type:** Responsive frontend web application\
**Primary audience:** Developers evaluating npm packages\
**API:** Public npm Registry API\
**Core promise:** Explore package metadata and compare options with
clarity, without overstating what public metadata proves.

## 1. Product overview

PackagePulse helps developers make a more informed first-pass decision
before adding an npm dependency. Users can search packages, inspect
package metadata and release information, review available dependency
data, compare two or three packages, and save packages locally.

PackagePulse is a **metadata explorer**, not a security scanner, quality
certification service, or guarantee of active maintenance. Downloads,
release dates, licenses and dependency counts are contextual signals
only.

## 2. Problem statement

Package evaluation often requires switching between npm pages,
repository links, version information and package metadata. Developers
need a focused interface that brings useful public information together
while clearly indicating missing or unavailable data.

## 3. Goals and measurable outcomes

-   Search by package name or keyword and see relevant results.
-   Show loading, empty, error, retry and partial-data states for
    API-driven views.
-   Let users inspect a package's metadata, versions, dependencies and
    release history where available.
-   Compare two or three packages with consistent fields and explicit
    "Unavailable" states.
-   Save and remove packages with browser local-storage persistence.
-   Support keyboard use, narrow viewports and modern desktop browsers.
-   Keep API access and presentation separated behind a replaceable
    service layer.
-   Avoid unsupported security, maintenance, popularity-quality or trust
    claims.

### Success criteria

-   Core journeys work from fresh load through success and failure
    states.
-   Search input is debounced and stale requests cannot overwrite newer
    results.
-   Missing values never silently become zero, an empty license
    assertion, or a false guarantee.
-   All routes have meaningful loading/error/empty behavior where
    applicable.
-   Tests cover service mapping, user-facing interactions and critical
    journeys.
-   Production build, lint, typecheck, test suite and visual QA pass
    before release.

## 4. Non-goals

-   No backend, account system, server-side saved list or
    authentication.
-   No package installation or execution of downloaded package code.
-   No vulnerability database, malware detection, package safety verdict
    or AI-generated health score.
-   No guarantee that a package is maintained, secure, compatible or
    suitable for a user's project.
-   No private registry authentication in the MVP.
-   No automated recommendations presented as authoritative engineering
    advice.
-   No server-side analytics or tracking by default.

## 5. User personas

### Primary: Dependency evaluator

A developer considering a package wants version, license, repository,
publication and dependency information quickly.

### Secondary: Comparison-oriented developer

A developer has shortlisted two or three libraries and wants to compare
available metadata side by side.

### Secondary: Research collector

A developer wants to save candidates and revisit them later in the same
browser.

## 6. User stories

-   As a developer, I can search by package name or keyword so I can
    discover candidate packages.
-   As a developer, I can sort results by supported fields so I can
    inspect them in a useful order.
-   As a developer, I can open a package detail view so I can inspect
    metadata and releases.
-   As a developer, I can view a dependency list when the registry
    metadata exposes it.
-   As a developer, I can compare two or three packages so differences
    are easier to see.
-   As a developer, I can save packages locally and revisit them after
    refreshing the page.
-   As a developer, I can retry a failed request and understand whether
    the problem is network, rate limit, missing package or unavailable
    data.
-   As a keyboard user, I can search, navigate, compare, save and
    dismiss dialogs without a mouse.

## 7. MVP priority

### Must have

-   Responsive application shell and navigation.
-   Package search, debounce, loading skeleton, results, empty state,
    error state and retry.
-   Package result cards/rows with name, description, latest version and
    available metadata.
-   Package details route/view with repository, homepage, license,
    latest version, publication details and dependencies where
    available.
-   Version/release information where public registry metadata supports
    it.
-   Compare 2--3 packages, add/remove candidates, comparison table and
    missing-data states.
-   Saved packages persisted with localStorage and safe handling of
    invalid stored data.
-   API service abstraction, typed models and request
    cancellation/stale-response protection.
-   Accessible controls and responsive layout.
-   Automated tests and project documentation.

### Should have

-   Search sorting and "Load more" or pagination where API behavior
    supports it.
-   Keyword filters based on available package keywords.
-   Copy install command (`npm install package-name`) with clear
    success/failure feedback.
-   Recently viewed packages stored locally, if it does not distract
    from core scope.
-   URL query parameters for search query and supported sort/filter
    state.

### Could have

-   Optional light theme only if fully designed and tested; dark theme
    is the MVP default.
-   Keyboard shortcut to focus search, documented and non-conflicting.
-   Small trend visual for release cadence only if actual release data
    is available and chart labels clearly explain the data.

### Not now

-   Accounts, sync, team workspaces, server-side persistence.
-   Security scanning, CVE lookups, license legal advice, maintainer
    reputation scoring.
-   Package install automation, code execution, AI-generated rankings.
-   Arbitrary package health score based on incomplete metadata.

## 8. Information architecture and route inventory

  -----------------------------------------------------------------------
  Route                   Purpose                 Primary action
  ----------------------- ----------------------- -----------------------
  `/`                     Landing / discovery     Search packages
                          entry point             

  `/explore`              Search results and      Open a package / add to
                          discovery filters       compare

  `/package/:name`        Detailed package        Inspect metadata,
                          overview                releases and
                                                  dependencies

  `/compare`              Compare selected 2--3   Review differences
                          packages                

  `/saved`                Locally saved packages  Reopen or remove a
                                                  saved package

  `*`                     Not-found route         Return to explore
  -----------------------------------------------------------------------

Route behavior: - `/` can contain the main search field and a curated,
clearly labeled "example searches" area. Do not fabricate live
popularity metrics. - `/explore?q=react` restores the query from the
URL. Empty query presents a helpful prompt rather than an API call. -
`/package/:name` supports URL-encoded scoped package names such as
`@scope/name`; test routing and decoding carefully. - `/compare` with
fewer than two selected packages explains how to add packages. Compare
selection can persist in localStorage. - `/saved` has a first-use empty
state and a populated state. - Unknown routes show a designed not-found
page with a clear action.

## 9. Page and component inventory

The list below is the required page-level UI inventory. Components may
be combined when doing so improves clarity; do not split components into
files just to inflate the count.

### Shared application shell --- every route

-   `AppShell`: page frame, background and content container.
-   `SkipToContentLink`: visible on keyboard focus.
-   `SiteHeader`: PackagePulse mark/wordmark, primary navigation, mobile
    menu trigger.
-   `PrimaryNavigation`: Explore, Compare with selected count, Saved
    with saved count.
-   `MobileNavigationDrawer` or compact menu: keyboard-accessible
    open/close, Escape support, focus handling.
-   `GlobalSearchTrigger` or shared `PackageSearchForm` where the route
    needs search.
-   `PageContainer`: shared max-width and responsive gutters.
-   `SiteFooter`: product description, npm Registry API
    attribution/link, limitations note.
-   `ToastRegion`: save/remove/copy feedback, accessible live
    announcements.
-   `RouteErrorBoundary`: graceful route-level fallback with
    retry/navigation.
-   `SkipLinkTarget`: main landmark.

### Page 1 --- Home `/`

-   `HomePage`
-   `HomeHero`: concise product positioning, primary search form,
    secondary "Explore packages" action.
-   `PackageSearchForm`: labeled input, clear button, submit behavior,
    optional debounce hint.
-   `SearchSuggestions`: example queries or recent searches; examples
    must not imply live results.
-   `DeveloperSignalStrip`: labels such as "Registry metadata", "Version
    history", "Dependency details"; not fake stats.
-   `DiscoveryWorkbenchPreview`: visually rich static preview of
    result/detail/compare surfaces, labeled as illustrative until live
    data loads.
-   `WorkflowSteps`: Search → Inspect → Compare → Save.
-   `MetadataLimitationsNote`: explains that public metadata is not a
    security or maintenance guarantee.
-   `HomeFooterCTA`: returns focus to search or navigates to Explore.

### Page 2 --- Explore `/explore`

-   `ExplorePage`
-   `ExplorePageHeader`: title, current query and result count only when
    count is known.
-   `PackageSearchForm`
-   `SearchFilterBar`: keyword filter, sort selector and clear filters;
    only controls backed by implemented behavior.
-   `ActiveFilterChips`
-   `SearchResultsSummary`: query, count/known pagination state.
-   `PackageResultsList` / `PackageResultsGrid`: responsive presentation
    with stable keys.
-   `PackageResultCard`: package name, description, latest version,
    license when present, weekly downloads only when sourced from an
    appropriate endpoint, last publication when available, keywords and
    actions.
-   `PackageNameLink`
-   `VersionBadge`
-   `MetadataPill`
-   `WeeklyDownloadsValue` with source/period label if implemented.
-   `PackageSaveButton`
-   `CompareSelectionButton`
-   `InstallCommandButton` with copy feedback.
-   `ResultsSkeleton`
-   `SearchEmptyState`: distinguish no query, no results and filters
    removing all results.
-   `SearchErrorState`: readable message, Retry and optional retry-after
    guidance for rate limiting.
-   `LoadMoreButton` or pagination control if implemented.
-   `CompareTray`: selected package chips, remove action, selected
    count, compare CTA; sticky on desktop only if it does not obscure
    content.
-   `BackToTop` only if long result lists justify it.

### Page 3 --- Package detail `/package/:name`

-   `PackageDetailPage`
-   `PackageDetailHeader`: name, description, version, save and compare
    actions.
-   `PackageIdentityBlock`: package name, scoped-package display and
    copy-name action.
-   `InstallCommandPanel`: command, copy action, install-method label.
-   `PackageQuickFacts`: license, latest version, publication date,
    repository and homepage when available.
-   `PackageMetadataGrid`
-   `PackageReadmeLink` or README preview only if safely supported and
    in MVP; external link is acceptable.
-   `VersionHistorySection`: version selector/list, published timestamps
    where available, empty/unavailable state.
-   `ReleaseTimeline` or `ReleaseList`: ordered release records from
    real version metadata; no invented cadence.
-   `DependenciesSection`: production dependencies, dependency count
    only when actual list/count is available.
-   `DependencyList`: name and version range; links to package detail
    when safe/valid.
-   `DependencyDisclosure`: expand/collapse large lists, show all/less.
-   `PackageKeywordsSection`
-   `RepositoryLink`, `HomepageLink`, `LicenseLink` as safe external
    links.
-   `MetadataSourceNote`: values come from public registry metadata and
    may be incomplete.
-   `PackageDetailSkeleton`
-   `PackageNotFoundState`
-   `PackageDetailErrorState` with Retry.
-   `MissingMetadataFallback`: consistent "Not provided" or
    "Unavailable" wording.

### Page 4 --- Compare `/compare`

-   `ComparePage`
-   `ComparePageHeader`: selected count and guidance.
-   `ComparePackagePicker`: search/select additional packages without
    leaving the comparison flow.
-   `ComparisonPackageHeader`: name, version, remove action, open
    details action.
-   `ComparisonTable`: accessible row/column headers.
-   `ComparisonRow`: metric name and values.
-   `ComparisonValue`: value, unavailable state and optional
    source/period.
-   Required comparison rows: latest version, license, weekly downloads
    (only if retrieved consistently for all), last publication,
    dependency count/list availability, repository, homepage, package
    keywords. Only show rows supported by the data contract.
-   `ComparisonDifferenceHighlight`: subtle highlight for differing
    values; never mark a winner or assign an unsupported score.
-   `ComparisonEmptyState`: fewer than two packages selected.
-   `ComparisonLimitState`: explain maximum of three and prompt removal.
-   `ComparisonLoadingState`
-   `ComparisonErrorState` with per-package retry/reload.
-   `ClearComparisonButton`
-   `AddAnotherPackageAction`

### Page 5 --- Saved `/saved`

-   `SavedPackagesPage`
-   `SavedPageHeader`: saved count.
-   `SavedPackagesList`
-   `SavedPackageCard` (reuse result-card primitives where appropriate)
-   `SavedAtOrSavedStatus` only if stored and meaningful.
-   `RemoveSavedButton`
-   `OpenPackageButton`
-   `SavedEmptyState`: search CTA and explanation that saves are
    browser-local.
-   `SavedStorageWarning`: only if storage is unavailable or corrupt
    data was recovered.
-   `ClearSavedConfirmationDialog` only if a bulk-clear action exists;
    do not add unnecessary destructive controls.
-   `SavedStorageAdapter`: not a visual component; typed storage
    boundary.

### Page 6 --- Not found `*`

-   `NotFoundPage`
-   `NotFoundIllustrationOrGraphic`: CSS/SVG-based technical motif, not
    generic stock art.
-   `NotFoundMessage`
-   `BackToExploreButton`

### Global reusable primitives

-   `Button`, `IconButton`, `TextLink`
-   `TextField`, `SelectField`, `Checkbox` where needed
-   `Badge`, `Tag`, `Tooltip` only when useful and accessible
-   `SkeletonBlock`
-   `Divider`
-   `InlineAlert`
-   `EmptyState`
-   `ErrorState`
-   `LoadingState`
-   `Dialog` only for real confirmation/selection needs
-   `ExternalLink` with safe `target`/`rel` handling
-   `CopyButton`
-   `VisuallyHidden`
-   `Spinner` for compact actions only; prefer skeletons for major
    content regions.

## 10. Functional requirements

### Search

-   Accept package names, scoped names and keyword queries.
-   Debounce typing (target around 250--350ms) while allowing Enter to
    submit immediately.
-   Cancel obsolete requests or ignore stale responses.
-   Keep the query in the URL on the Explore page.
-   Validate and normalize input without rejecting valid scoped package
    syntax.
-   Provide clear, loading, error, no-results and results states.
-   Do not claim the registry search is a perfect keyword index;
    describe behavior honestly.

### Metadata and details

-   Read package metadata from npm Registry API endpoints.
-   Display available fields without inferring absent values.
-   Safely handle malformed, unexpectedly shaped or partial responses.
-   External links must use valid `http:` or `https:` URLs and be
    clearly external.
-   Version data should be sorted by publication timestamp where
    available, not by string comparison alone.

### Comparison

-   Maximum three packages, minimum two to render the table.
-   Prevent duplicate selection.
-   Keep each package's fetch status visible; one failed package must
    not erase other successful data.
-   Do not compute an overall winner, security score or "health grade".
-   Distinguish zero from unknown/unavailable.

### Saved packages

-   Persist stable package identifiers, not entire large registry
    documents.
-   Validate parsed localStorage data at runtime.
-   Handle quota/security exceptions and disabled storage without
    crashing.
-   Saved list should gracefully handle packages that are deleted or
    unavailable from the registry.

### API resilience

-   Skeleton loading, inline retry, helpful empty state, rate-limit
    handling, network error handling and malformed response fallback.
-   Avoid infinite retries. Any automatic retry must be bounded and
    conservative.
-   Preserve useful UI state when a request fails.
-   Use request cancellation when leaving a route or changing query.

## 11. Content and language rules

Use neutral labels: - "Weekly downloads" with a defined period/source
when data is actually fetched. - "Last published" with a date and
time-zone-aware formatting. - "License: Not provided" when absent. -
"Registry metadata unavailable" when a request cannot provide a field.

Never use unsubstantiated labels such as: - "Secure", "safe",
"vulnerability-free", "trusted" - "Actively maintained" based only on
publication date - "Best package", "health score", "quality score" -
"Guaranteed compatible" - "Zero dependencies" when dependency data was
not successfully loaded.

## 12. Accessibility requirements

-   Semantic landmarks and logical heading order.
-   Search fields have persistent labels; placeholders are not labels.
-   All actions keyboard operable and have accessible names.
-   Visible focus states with adequate contrast.
-   Dialog/menu focus management and Escape behavior.
-   Errors associated with the relevant input or region; announce async
    status through an appropriate live region.
-   Comparison table uses real table semantics.
-   Do not communicate state through color alone.
-   Respect `prefers-reduced-motion`.
-   Maintain touch targets and readable text on mobile.
-   External links are distinguishable and do not open unexpected tabs
    without clear indication.

## 13. Acceptance criteria

The MVP is accepted only when: 1. Every route listed above renders and
has a designed empty/error/loading state as applicable. 2. Search
supports debouncing, Enter submit, retry and stale-response protection.
3. Package details render actual returned metadata and handle missing
fields. 4. Comparison supports two and three packages, removal,
duplicate prevention and partial failures. 5. Saved packages survive
refresh when storage is available and recover from invalid stored data.
6. No UI implies security or maintenance guarantees from metadata alone.
7. Mobile/tablet/desktop layouts have been visually checked. 8.
Keyboard-only core journeys pass. 9. Automated tests, lint, typecheck
and production build pass. 10. README documents setup, architecture, API
limitations and known constraints. 11. The requested security audit is
run after implementation, or explicitly marked incomplete with the exact
environmental blocker.
