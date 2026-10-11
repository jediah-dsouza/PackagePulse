# Changelog

A record of the planning and implementation work completed for PackagePulse. The project is being delivered through gated phases; this log distinguishes completed foundation work from features intentionally deferred to later phases.

## 2026-10-10 — Phase 0 planning and Phase 1 foundation

### Planning and project setup

- Completed and received approval for Phase 0 before implementation. Reviewed the supplied project README, PRD, TRD, app flow, design brief, implementation plan, master-agent prompt, governing frontend workflow, design reference, and security-audit instructions.
- Inspected the requested UI/quality references: UI UX Pro Max, Impeccable, Taste, Emil Kowalski's skills, anti-slop, Hallmark, Ponytail, Unlazy, and Cloudflare's security-audit skill. Recorded relevant constraints and design decisions in the approved plan.
- Confirmed `/data/PackagePulse` did not exist and its parent was not inside a Git repository. Created the project there and initialized a fresh `main` Git repository; no initial commit has been made.
- Preserved the supplied project, workflow, design, and security source documents under `docs/source/`.

### Added

- Established a strict TypeScript frontend foundation with React 19, Vite, Tailwind CSS 4, React Router 7, Lucide icons, and Exo 2 variable font. Added Vitest, React Testing Library, Playwright, and Axe-based browser accessibility checks.
- Added project setup documentation, architecture notes, lint/format/test/build/browser configuration, `.gitignore`, and the Phase 1 gate checklist with verification evidence.
- Added a semantic design-token layer and responsive application styling aligned to the approved package-inspection workbench direction.
- Added shared layout and UI components: application shell, responsive header/navigation, skip link, footer, route error boundary, toast region, phase notices, and preview labels. Mobile navigation uses a native dialog and restores focus when it closes.
- Added designed route shells and navigation for:
  - `/` — Home and workflow overview
  - `/explore` — Search-layout preview
  - `/package/:name` — Package detail and metadata layout
  - `/compare` — Accessible comparison-table preview
  - `/saved` — Saved-packages empty state
  - `*` — Not-found recovery page
- Added dynamic page titles, unit/component coverage, and Playwright route, viewport, navigation, scoped-package-route, and accessibility tests.

### Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm run test -- --run` — passed; 4 tests.
- `npm run build` — passed; Vite transformed 1,931 modules and emitted the production bundle.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 4 Playwright tests, including all six routes at 360×800, 768×1024, and 1280×900. Route screenshots were reviewed, no page-width overflow was found, mobile navigation behavior passed, and Axe reported zero violations.
- Confirmed that Phase 1 source contains no npm Registry requests, search service, comparison selection, or browser storage. Explore search controls are disabled and clearly identified as a later-phase preview.
- Recorded all Phase 1 acceptance gates G1–G8 as passed in `GATES.md`.

### Deferred by phase boundary

- Live npm Registry search, package lookup, result filtering, version/release data, dependency data, comparison behavior, and saved-package persistence remain unimplemented pending authorization for later phases.
- The Cloudflare security audit has not been run; it remains scheduled for the post-implementation audit phase. No security-audit completion is claimed here.

## 2026-10-10 — Phase 2 search and discovery

### Added

- Connected Explore to the public npm Registry Search API through a typed service boundary. Search requests encode `text`, `size`, and `from`; runtime mapping validates package identifiers and optional metadata, drops unsafe external links, and preserves missing fields as unavailable.
- Added 300 ms debounced search, immediate Enter submission, clear search, URL-backed query/filter/sort state, browser history restoration, abortable requests, and stale-response protection.
- Added Registry pagination with Load more, exact returned-keyword filtering, and local Name / Recently published sorting over loaded results.
- Added explicit idle, loading-skeleton, success, no-results, filtered-empty, error, retry, and retry-load-more experiences with screen-reader status/error announcements.
- Added package result summaries, safe scoped-name detail-shell links, public npm links, latest Registry version, available description/license/publication date/keywords, and copy-install-command feedback.
- Added the PackagePulse SVG favicon and automated coverage for live-search UI journeys using mocked Registry responses.

### Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed, including this changelog.
- `npm run test -- --run` — passed; 5 test files, 33 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 10/10 Playwright tests, including search, pagination, filtering, sorting, copy, URL/back-forward, scoped names, error recovery, viewport overflow, mobile navigation, and Axe checks.
- `npm run build` — passed; Vite transformed 1,937 modules.
- Live Chromium check of `/explore?q=react` — Registry HTTP 200; 20 results rendered, `react` first, no failed resource responses or page errors.
- Inspected rendered Explore initial and successful result states at 360×800, 768×1024, and 1280×900; loading, empty, and rate-limit states at 360×800. No horizontal overflow was found. Axe reported no violations in the Explore results view.

### Scope and limitations

- Explicit Phase 2 authorization excluded comparison behavior and saved-package persistence even though the broader implementation plan mentions result actions; those actions remain absent.
- Search results do not trigger downloads lookups or make package security, maintenance, quality, compatibility, or suitability claims.
- npm Registry availability and rate limits are outside the app's control. A specific retry delay is shown only when the browser can read the `Retry-After` response header; otherwise the UI offers a general wait-and-retry instruction.
- The Cloudflare security audit remains deferred to its assigned post-implementation phase.

## 2026-10-10 — Phase 3 package details, versions, and dependencies

### Added

- Reused the typed npm Registry service for package packuments and selected-version manifests. Added safe URL construction for package names and versions, including scoped packages, runtime validation/mapping, structured HTTP/network errors, abort handling, and bounded streaming reads.
- Added a detail route that supports direct navigation, refresh, scoped package names, browser history, explicit retry, loading skeletons, and actionable not-found, rate-limit, network, server, malformed-response, and oversized-response states.
- Displayed Registry-backed package identity, description, latest version, license, publication date, safe repository/homepage/npm links, keywords, release history, and selected-version dependency/peer/optional groups.
- Added a selected-version manifest request and bounded in-memory cache, version-specific install command with copy feedback, and accessible release/version controls. No README HTML, downloads, quality metrics, security claims, comparison behavior, or saved-package persistence were added.
- Added an oversized-packument fallback: full packument up to 12 MiB; abbreviated representation up to 12 MiB; latest-only manifest up to 2 MiB, with release history explicitly unavailable. Selected version manifests are limited to 2 MiB; over-limit streams are cancelled.
- Updated service, mapping, hook, component, integration, and Playwright coverage; replaced obsolete “detail shell” accessibility text with the functional detail-route label.

### Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 7 files, 58 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npx playwright test` — passed; 13/13 browser journeys, including Phase 2 regression, detail 404/rate-limit retry, scoped direct route/refresh, selected-version dependencies, browser back/forward, responsive overflow, and Axe checks.
- `npm run build` — passed; Vite transformed 1,940 modules.
- Live local-browser smoke — `react` and scoped `@types/node` package detail routes each received Registry HTTP 200, rendered package metadata and release sections, and produced no page errors.
- Reviewed the rendered detail screenshots at 360×800, 768×1024, and 1280×900. Fixed narrow-screen install-command wrapping and rechecked the mobile render. No horizontal overflow was found at any target width. Axe reported zero violations on the detail view at desktop width and on the route-shell suite.

### Scope and limitations

- Oversized package records that exceed all bounded representations fail with a clear error rather than being partially parsed. If the latest-only fallback is used, full release history and publication dates unavailable from that response remain marked unavailable.
- Older-version details are fetched only after selection; Registry limits or missing/malformed version manifests are surfaced as version-specific unavailable/error states.
- Comparison behavior, saved-package persistence, and the Cloudflare security audit remain deferred to their assigned phases.

## 2026-10-10 — Phase 3 remediation

### Added

- Added an accessible package-name copy control beside the detail heading. It copies the exact Registry identifier, including scoped names, and announces success or an actionable clipboard failure.
- Added Show all / Show less disclosure for dependency groups with more than 40 entries, keeping the compact first-40 view by default while making every validated returned entry inspectable.
- Added deterministic size-limit tests for selected-version streams above 2 MiB, cancellation at the cap, and an oversized latest-only fallback. The detail route now has explicit coverage for its actionable terminal too-large state.
- Added a delayed-response test for the package-detail loading skeleton and a keyboard-only browser journey covering focus visibility, copy feedback, dependency disclosure, and entries beyond the initial 40.

### Verification

- `npm run typecheck`, `npm run lint`, and `npm run format:check` — passed.
- `npm test -- --run` — passed; 7 files, 67 tests, including a UI check distinguishing unavailable dependency data from a confirmed empty group.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 14/14 journeys.
- `npm run build` — passed; Vite transformed 1,940 modules.
- Reviewed refreshed detail screenshots at 360×800, 768×1024, and 1280×900; no horizontal overflow. Axe reported zero violations on the desktop detail and route-shell checks.
- Rechecked live `react` and `@types/node` package records using the bounded Registry service; both returned latest-version metadata and available release history.

### Scope

- No Phase 4 functionality or Git commit was added. Comparison behavior, saved-package persistence, and the Cloudflare security audit remain deferred.

## 2026-10-10 — Phase 4 package comparison

### Added

- Added comparison selection from Explore results, package detail pages, and a Registry search picker on `/compare`. Names are validated, deduplicated, limited to three, and persisted as identifiers under `packagepulse:compare:v1`; malformed stored values are recovered safely, and blocked storage leaves the in-session flow usable.
- Added a global selected-package tray/count, add/remove/clear actions, detail-route links, and selection-limit feedback.
- Replaced the comparison preview with a live npm Registry metadata table. Each package column loads and retries independently, and a failed column does not erase successful package data.
- Added explicit values for Registry metadata that is not provided, dependency data that is unavailable, and valid empty dependency lists. The table includes latest version, license, publication date, dependency availability/count, repository, homepage, and keywords.
- Kept comparison informational: differing values are highlighted without a winner or package-quality/security score. Weekly downloads are not requested or shown. Mobile/tablet use a labeled, keyboard-focusable horizontal table region.
- Added deterministic coverage for selection persistence/recovery, delayed comparison loading, independent package/dependency retries, empty versus unavailable dependency data, and Clear comparison. Browser journeys cover two/three packages, the maximum selection, scoped package detail-entry and reopen links, keyboard operations, responsive table scrolling, and accessibility.

### Verification

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --run`, `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`, and `npm run build` — final outcomes recorded in `GATES.md`.
- Full Playwright suite — 20/20 passed. The comparison route was visually inspected at 360×800, 768×1024, and 1280×900; mobile/tablet table scrolling stayed inside the labeled region and the page did not overflow. Axe reported zero violations on the rendered comparison route.
- No Git commit was created. Saved-package persistence and the Cloudflare security audit remain outside Phase 4.

## 2026-10-10 — Phase 5 saved packages

### Added

- Added a versioned local-storage adapter at `packagepulse:saved:v1` that persists only valid, deduplicated npm package identifiers. Malformed data is recovered; inaccessible or quota-limited storage falls back to session-only in-memory state with a clear warning.
- Added shared saved state and accessible save/remove controls to Explore results and package details. The header's Saved link reflects the current count; a live toast announces save, removal, and session-only outcomes.
- Replaced the Saved placeholder with an empty state and a compact saved-package list. Saved cards fetch available metadata through the existing npm Registry service, show loading skeletons, retry transient failures, preserve unavailable/deleted identifiers with an actionable detail route, and support removal.
- Added synchronization for browser `storage` events. No comparison behavior or backend persistence was changed.
- Added adapter/component tests for scoped names, duplicate prevention, malformed/blocked/quota storage, cross-route updates, storage events, metadata states, retry, keyboard operation, and persistence; added Playwright journeys for Explore/detail save, refresh, remove, and responsive/a11y checks.

### Verification

- `npm run typecheck`, `npm run lint`, and `npm run format:check` — passed.
- `npm test -- --run` — passed; 11 test files, 92/92 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 24/24 browser journeys, including Phases 1–4 regression.
- `npm run build` — passed; Vite transformed 1,952 modules.
- Reviewed rendered Saved, Explore, and scoped package detail views at 360×800, 768×1024, and 1280×900. Automated overflow checks passed at all three sizes; Axe reported zero violations on each route at desktop width.
- Automated Registry traffic was mocked for deterministic saved-list tests. No Phase 5 live Registry smoke was run. A storage event was tested synthetically in jsdom, not with a second live browser tab.
- No Git commit was created. The Cloudflare security audit remains deferred to the post-implementation audit phase and was not run.

## 2026-10-10 — Phase 6 integration hardening

### Changed

- Fixed caught route errors remaining latched after “Go to Explore”: the error-boundary view now resets when the router location changes.
- Added focused component coverage for route-error recovery and the not-found route’s Explore recovery link.
- Added Registry failure/recovery browser coverage for sequential network failure, malformed JSON, retry, and eventual success; added a stale-search-response journey and browser console/page-error assertions across all route shells.
- Extended automated Axe checks to all six routes at mobile (360px), tablet (768px), and desktop (1280px) widths. Added a real two-tab browser test for saved-state synchronization.
- Added detail-page rendering tests for untrusted HTML-like package strings and unsafe `data:` / `javascript:` metadata URLs. React renders Registry strings as text; the existing service mapping drops unsafe links.
- Removed `src/components/ui/PhaseNotice.tsx` after confirming it had no imports or callers. Reviewed the declared dependency set; no unused direct dependency was identified, so package manifests were not changed.

### Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 files, 95/95 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 28/28 Playwright journeys. Coverage includes route-error and 404 recovery, scoped detail routing/history, network/malformed/404/429 recovery, retry and partial-column failure, stale search response handling, saved-state synchronization across two real tabs, and Phase 1–5 regression journeys.
- `npm run build` — passed; Vite transformed 1,952 modules.
- Live smoke through the existing `getNpmPackageDetails` service — passed for `react` (latest `19.3.0`, 2,967 releases) and scoped `@types/node` (latest `26.6.5`, 2,381 releases); both returned full metadata records. These are point-in-time public Registry results.
- Reviewed current responsive screenshots and interactive-page captures at 360×800, 768×1024, and 1280×900. Route-shell journeys recaptured all six routes at each viewport, confirmed no horizontal overflow, and observed no page errors or console errors. Axe reported zero violations for 18 route/viewport combinations.
- The first full browser run exposed an assumption in the new network-failure fixture about React Strict Mode's development mount/abort behavior. The fixture was made deterministic; the focused package-detail journeys then passed 5/5 and the final full suite passed 28/28.
- No Git commit was created. The repository has no prior commit baseline and project files remain untracked. Phase 7 visual/accessibility/performance work and the Cloudflare security audit remain outside this authorization and were not started.

## 2026-10-10 — Phase 6 gate review

### Reviewed

- Read `GATES.md` gates G39–G44 and checked the cited route-recovery, API failure/retry/cancellation, URL/history, storage synchronization, safe Registry rendering, responsive/Axe, and full-suite test evidence.
- Confirmed the gate record reports G39–G44 passed: 95/95 unit/component tests, 28/28 Playwright journeys, passing typecheck/lint/format/build, 18 Axe route/viewport checks, and live service smoke for `react` and `@types/node`.
- The review was read-only and did not rerun the recorded verification commands. Limitations noted: not every API failure state has end-to-end coverage; the Axe route matrix does not replace broader Phase 7 dynamic-state review; the live Registry smoke is point-in-time; the Git worktree has no commit baseline and project files remain untracked.

### Remaining approved workflow

- Phase 7: accessibility, responsive, motion, and performance QA.
- Phase 8: documentation, production build, dependency audit, deployment readiness, and SPA route/refresh verification.
- Phase 9: full Cloudflare security audit using the supplied audit workflow and its required artifacts. Confirm the audit output path before starting.
- Phase 10: final acceptance and handoff against PRD criteria.

No Phase 7 work, Cloudflare audit, or Git commit was started during the review.

## 2026-10-10 — Phase 7 accessibility, responsive, motion and performance QA

### Changed

- Raised the shared border token to meet the 3:1 non-text contrast target on all three app surfaces; increased undersized package links, metadata links, keyword chips, footer links, comparison remove controls, and saved-result links to at least a 44px touch target.
- Added an explicit visible focus style to the main-content skip-link target. The mobile navigation now focuses its close control on open, traps Tab/Shift+Tab within the native dialog, and restores focus to the trigger after Escape/close.
- Expanded the package-detail loading skeleton's reserved height after performance measurement showed the footer being pushed out of the viewport during the transition to loaded detail data. Added a visually hidden level-one heading after Axe found that the loading state otherwise had no h1.
- Added Phase 7 Playwright coverage: all six route success states at seven responsive sizes, document overflow and target-size assertions, border contrast, Axe scans and screenshots; keyboard skip-link/dialog checks; delayed package-detail loading; Explore empty/rate-limit, detail 404, comparison partial failure and Saved-empty Axe checks; and reduced-motion verification.
- Added `npm run perf:smoke`, a deterministic production-preview Chromium measurement script for route navigation/render timing, layout shift, resource transfer, JavaScript heap, and generated asset sizes. No dependency was added.

### Verification

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --run`, `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`, and `npm run build` — all passed after the final application changes; exact counts are recorded in `GATES.md`.
- Unit/component suite: 13 files, 95/95 tests passed. Playwright: 33/33 journeys passed, including the new 5/5 Phase 7 journeys. Production build transformed 1,952 modules.
- Axe: zero violations on six routes × seven viewports (42 checks), the open navigation dialog, delayed detail loading, Explore empty/rate-limit, detail 404, comparison partial failure, and Saved empty states (49 checks total). No page overflow or visible undersized target was found in the tested success-state matrix.
- Performance smoke (`CHROMIUM_PATH=/usr/local/bin/chromium npm run perf:smoke`): six deterministic routes, one warmup and five recorded samples each at 1280×900. Median FCP 184–220 ms, LCP 184–252 ms, CLS 0.000052–0.02576; JS 344,315 bytes (102,287 gzip), CSS 48,651 bytes (9,748 gzip). Detail CLS fell from 0.11065 to 0.000052 after the skeleton adjustment.
- Screenshots were visually reviewed for mobile detail/comparison/Saved, tablet comparison, and desktop Explore/detail/not-found. Only system Chromium 153.0.8010.12 was available; Firefox, Safari/WebKit, Edge, and manual screen-reader testing were not verified. Performance figures are local, unthrottled, synthetic and not field data. Registry requests were mocked; no new live Registry smoke was run.
- No Git commit was created. Phase 8, Phase 9, deployment, and the Cloudflare security audit were not started.

## 2026-10-10 — Phase 8 documentation, production build and deployment readiness

### Changed

- Updated the README with the Node.js versions required by the full toolchain, lockfile-based setup, all test/performance commands, and provider-neutral static deployment instructions.
- Documented the Vite SPA fallback requirement, root-mounted asset path, direct-route refresh requirements, browser-side public Registry dependency, and the limits of local preview versus real deployment. No hosting provider was selected or configured.
- Updated `docs/architecture.md` to reflect Phase 7 responsive/Axe checks and the `GATES.md` evidence record.
- Corrected `package.json`'s Node engine range to `^22.13.0 || ^24.0.0 || >=26.0.0`, matching the current Vite/ESLint/Vitest toolchain. Regenerated the lockfile metadata to remove its stale root license value; no package versions or dependency declarations changed.
- Added Phase 8 gates G51–G56, including explicit accounting for all 84 untracked project files in the no-commit-baseline repository.

### Verification

- Verification runtime: Node.js `v24.14.1`, npm `11.11.0`, system Chromium `/usr/local/bin/chromium`.
- `npm ci --no-audit --no-fund` — passed from the final lockfile; 259 packages installed.
- `npm ls --depth=0` — passed with the declared direct dependency tree present.
- `npm audit --json` — passed, exit code 0; zero vulnerabilities reported for the complete lockfile tree at audit time.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --run`, `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`, and `npm run build` — passed; exact results are in `GATES.md`.
- Unit/component tests: 13 files, 95/95 passed. Playwright: 33/33 passed. Production build transformed 1,952 modules.
- Vite production-preview smoke: direct load and refresh for six main paths (home, Explore, Compare, Saved, scoped package detail, and not-found) passed 12/12 checks with HTTP 200, correct client-rendered headings, and no browser console/page errors. Scoped Registry data was intercepted deterministically.
- `dist/` contains the built HTML, favicon, hashed CSS and JS, and five font assets; no source maps were emitted. The main JS is 344,315 bytes and CSS is 48,651 bytes.
- No deployment was performed. A real provider's SPA rewrites, TLS/domain, headers/cache, and live-origin route refresh remain unverified; the local preview is not represented as deployed verification. Phase 9 security audit and Git commit were not started.

## 2026-10-10 — Targeted Registry security-review follow-up

### Changed

- Search-result “Open npm page” links are now constructed from the validated package name and the canonical `www.npmjs.com` origin; Registry-supplied `links.npm` can no longer redirect that labeled action to another destination.
- Added response cardinality and field-size bounds: search results cannot exceed the requested page size (maximum 250); descriptions are limited to 4,096 characters; keyword collections to 100 unique terms of at most 128 characters; version history to 5,000 entries; dependency groups to 2,000 entries; licenses to 256 characters; external URLs to 2,048 characters; and date strings to 64 characters.
- Over-limit content is omitted, truncated, marked partial, or reported as unavailable rather than rendered as complete. The interface discloses truncated descriptions/keywords, over-limit version history, and dependency groups that reach their cap. Existing search retry, release inspection, and dependency disclosure behavior are preserved.
- Added service and Explore component regressions for misleading/unsafe npm link metadata, oversized search arrays, excessive versions/dependencies, and long metadata fields.
- Added [`docs/security-review.md`](docs/security-review.md) with the earlier static-review concern dispositions, current bounds, test evidence, and outstanding verification limitations.

### Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 test files, 106 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 33/33 Playwright journeys using deterministic Registry fixtures.
- `npm run build` — passed; Vite transformed 1,952 modules; JavaScript 346.28 kB and CSS 48.65 kB (uncompressed output).

### Limitations

- No live Registry smoke or deployed-host verification was performed for this follow-up. JSON parsing remains synchronous within existing bounded body limits; no hostile CPU/heap stress benchmark was run.
- Version histories above 5,000 entries and dependency groups above 2,000 entries are intentionally incomplete and labeled as such. This is not a complete security audit.
- No deployment or Git commit was created.

## 2026-10-10 — NV-2 bounded-metadata follow-up

### Changed

- Capped keyword scanning at 200 raw array entries before filtering or deduplication, while retaining at most 100 unique terms of at most 128 characters. Any raw entries or keyword terms omitted by those limits set the existing truncation indicator.
- Updated comparison keyword rows to say “Keyword entries omitted by safety limits” when the retained list is empty but truncated; a genuinely absent, non-truncated keyword list still reads “Not provided.”
- Added early length checks for oversized unpadded strings before trimming where the field has a maximum, while preserving trimming behavior for valid padded values. Dependency ranges use the same pattern with a 512-character bound.
- Closed the agreed targeted NV-2 follow-ups in `docs/security-review.md`. This does not claim a complete Cloudflare security audit.

### Verification

- `npm run typecheck`, `npm run lint`, and `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 files, 112 tests. New cases cover duplicate, invalid, and overlong keyword entries beyond the raw scan cap; padded-valid and oversized raw fields; dependency range boundaries; and omitted versus not-provided comparison keywords.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 33/33.
- `npm run build` — passed; 1,952 modules transformed; JavaScript 346.76 kB and CSS 48.65 kB (uncompressed).

### Limitations

- JSON parsing remains synchronous after bounded streaming reads. Edge-padded oversized values use normal trimming to preserve valid padded-input behavior; response byte caps bound their maximum size.
- No live Registry smoke, deployment, complete Cloudflare audit, or Git commit was performed.

### Final remediation review

- A read-only review confirmed NV-1's canonical npm URL construction and the agreed NV-2 raw keyword scan cap, omitted-data disclosure, field/range bounds, and comparison behavior. NV-1 is closed; NV-2 is closed for the agreed targeted remediation. This is not a complete security audit.
- After the final wording-only changelog correction, `npm run format:check` and `npx prettier --check docs/security-review.md CHANGELOG.md` passed. The typecheck, lint, 112-test unit/component suite, 33/33 Playwright suite, and production build results above were obtained after the source/test changes and before that documentation-only correction; executable checks were not rerun for the wording change.
