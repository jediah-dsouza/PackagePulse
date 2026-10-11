# Gates: PackagePulse Phase 1

Scope: establish a designed, navigable React/TypeScript/Vite foundation and all six route shells without implementing search or later package features.

- [x] G1: TypeScript strict check passes
      CHECK: npm run typecheck && printf 'phase1:typecheck:passed\n'
      EXPECT: phase1:typecheck:passed
      EVIDENCE: passed (exit 0; final validation)

- [x] G2: ESLint and formatting checks pass
      CHECK: npm run lint && npm run format:check && printf 'phase1:static-checks:passed\n'
      EXPECT: phase1:static-checks:passed
      EVIDENCE: passed (ESLint --max-warnings=0 and Prettier; exit 0)

- [x] G3: Unit and component tests pass
      CHECK: npm run test -- --run && printf 'phase1:unit-tests:passed\n'
      EXPECT: phase1:unit-tests:passed
      EVIDENCE: passed (Vitest: 1 file, 4 tests; exit 0)

- [x] G4: Production build succeeds
      CHECK: npm run build && printf 'phase1:build:passed\n'
      EXPECT: phase1:build:passed
      EVIDENCE: passed (Vite production build; 1,931 modules; exit 0)

- [x] G5: Browser routes and mobile navigation work
      CHECK: CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e && printf 'phase1:browser-routes:passed\n'
      EXPECT: phase1:browser-routes:passed
      EVIDENCE: passed (Playwright: 4 tests, all passed; Axe: 0 violations)

- [x] G6: Every required route is visually inspected at mobile, tablet, and desktop sizes
      EVIDENCE: passed (6 routes × 360/768/1280; screenshots reviewed under test-results/playwright/)

- [x] G7: No search/API, compare selection, storage, or later-phase behavior has been implemented
      EVIDENCE: passed (source review and rg scan; Explore controls disabled and disclosed)

- [x] G8: Git diff contains only intentional PackagePulse files
      EVIDENCE: passed (fresh repo root is PackagePulse; worktree contains only project files)

## Phase 2 scope resolution

The Phase 2 plan lists compare and save actions among Explore result actions. This authorization explicitly prohibits package-comparison behavior and saved-package persistence, so those actions are omitted rather than implemented with temporary or misleading behavior. The planned copy-install action is included. Result links may navigate to the existing detail shell, but package-detail data remains deferred to Phase 3.

## Gates: PackagePulse Phase 2

- [x] G9: Typed npm search service, URL construction, runtime validation, mapping, and HTTP/network error classification
      EVIDENCE: passed; `npmRegistryService.ts` builds encoded `text`/`size`/`from` parameters, validates untrusted response fields, maps partial metadata, rejects malformed shapes, and classifies network, HTTP 404/429/5xx, and parse failures. `npm run test -- --run`: 12 service tests passed.

- [x] G10: 300 ms typing debounce, immediate Enter submit, clear behavior, and `q` URL restoration with back/forward support
      EVIDENCE: passed; component tests cover debounce, Enter, clear, and URL restoration; Playwright journey verifies reload plus back/forward. Query/filter/sort URL state is documented in README and architecture notes.

- [x] G11: Stale request cancellation/guard, `from`/`size` Load more, returned-keyword filtering, and supported local sorts
      EVIDENCE: passed; hook tests verify stale responses cannot replace current results, offsets append correctly, and failed Load more can be retried without losing existing rows. Component and Playwright tests cover returned-keyword filtering and loaded-result sorting.

- [x] G12: Initial, loading, results, no-results, filtered-empty, network/server/rate-limit/malformed error, retry, and retry-load-more UI states
      EVIDENCE: passed; component/service tests cover the state and error paths; browser tests cover loading, no results, rate-limit recovery, successful results, and retry. Errors stay actionable and automatic retry is not used.

- [x] G13: Safe scoped-name routing, copy-install and external-link behavior; no unsupported metrics or future-phase persistence/comparison
      EVIDENCE: passed; response mapping validates package identifiers and HTTP(S) links; Playwright verifies scoped package URL handling and install-command copying. No weekly-download requests, comparison action, saved persistence, or package-detail request was added.

- [x] G14: Service, mapping, hook, component, integration, and Playwright tests pass with deterministic mocked responses
      EVIDENCE: passed; `npm run test -- --run`: 5 files, 33 tests passed. `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`: 10/10 passed; deterministic registry responses are mocked in journeys.

- [x] G15: Live npm Registry service smoke check succeeds where network access is available
      EVIDENCE: passed; live Chromium smoke at `/explore?q=react` received Registry HTTP 200, rendered 20 results with `react` first, showed the registry total, and recorded no failed resource responses or page errors. This is a point-in-time public API check, not a guarantee of availability.

- [x] G16: Actual Explore initial, loading, empty/error, and successful-results views pass visual and accessibility QA at target widths
      EVIDENCE: passed; inspected captured Explore screenshots at 360×800, 768×1024, and 1280×900. Successful and initial states were checked at all three widths; loading, empty, and rate-limit error states were inspected at 360×800. Tests found no horizontal overflow. Axe found no violations in the Explore results view at 1280px; the route-shell suite also passed its six-route Axe checks.

- [x] G17: Typecheck, lint, formatting, all tests, production build, and relevant documentation pass
      EVIDENCE: passed; `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test -- --run`, `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`, and `npm run build` all completed successfully. README, architecture, changelog, and this gate record were updated to actual outcomes. Default Playwright browser cache was unavailable; setting `CHROMIUM_PATH` to installed system Chromium resolved it.

### Phase 2 verification record

- Date: 2026-10-10.
- Final static checks and build: passed; Vite transformed 1,937 modules.
- Final automated totals: 33 unit/component tests and 10 Playwright tests passed.
- Live registry smoke: 1 successful search request (HTTP 200); 20 mapped results rendered.
- Phase boundary: compare behavior, saved-package persistence, package-detail data, and the Cloudflare security audit were not implemented in Phase 2.

## Gates: PackagePulse Phase 3

Scope: functional, read-only package detail, release history, and selected-version dependency inspection using the public npm Registry. Comparison behavior, saved-package persistence, and the full Cloudflare audit remain outside this phase.

- [x] G18: Existing Registry service extended for typed package and version manifests
      EVIDENCE: passed; `getNpmPackageDetails` and `getNpmPackageVersionDetails` share the Phase 2 service boundary, URL builders, runtime validation, typed errors, and abort support. Service tests cover full and scoped package/version URLs and field mapping.

- [x] G19: Bounded package reads and oversized-response fallbacks are validated
      EVIDENCE: passed; full and abbreviated packuments are capped at 12 MiB, selected/latest manifests at 2 MiB. Existing deterministic tests verify 12 MiB over-limit fallback and release history unavailable in latest-only mode. Remediation tests also stream a selected-version manifest across 2 MiB, verify a terminal latest-only manifest over 2 MiB returns `too-large`, and assert the reader cancels after the two bounded chunks rather than consuming the remaining stream. The detail component test verifies the terminal error and retry action.

- [x] G20: Direct, scoped, refreshed, and history-navigated package routes work; stale requests do not replace current state
      EVIDENCE: passed; hook tests verify invalid-name request suppression and abort/late-response protection. Playwright verifies direct `/package/%40types%2Fnode`, refresh, selected version, dependency navigation, browser back, and forward.

- [x] G21: Registry-backed package facts, dated release history, and selected-version dependency groups distinguish empty data from unavailable data
      EVIDENCE: passed; mapping reads package name/description, `dist-tags.latest`, version manifests, `time`, license, homepage/repository, keywords, and dependency/peer/optional groups. Release history uses Registry timestamps where present. Tests distinguish confirmed empty dependency data from missing/malformed data.

- [x] G22: Detail loading/error/retry states, safe external links, and copy-install action work without rendering README HTML
      EVIDENCE: passed; service/component tests cover validated links, install-command copy, exact package-name copy (normal and scoped), clipboard failure feedback, 404, network, malformed/oversized data, selected-version failure and retry; Playwright verifies 404 recovery and rate-limit retry. Success uses a polite status announcement; clipboard failure is announced as an alert. README content is not rendered.

- [x] G23: Deterministic service, mapping, hook, component, and browser regression suites pass
      EVIDENCE: passed after remediation; `npm test -- --run`: 7 files, 67/67 tests. `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`: 14/14 journeys passed, including keyboard-only detail copy/disclosure, dependency entries beyond 40, Phase 2 search regressions, and responsive checks. Responses are mocked for automated tests.

- [x] G24: Live public Registry smoke succeeds for normal and scoped packages where network access is available
      EVIDENCE: passed; local Chromium opened live `/package/react` and `/package/%40types%2Fnode`; both Registry requests returned HTTP 200, package metadata and release sections rendered, and no page errors occurred.

- [x] G25: Actual mobile, tablet, and desktop detail renders are reviewed; layout and accessibility checks pass
      EVIDENCE: passed after remediation; reviewed the refreshed detail screenshots at 360×800, 768×1024, and 1280×900, including the package-name control at each width. Playwright found no horizontal overflow; Axe reported zero violations on the detail page at 1280px and across the route-shell checks. The keyboard journey verified a visible 3px focus outline, accessible copy/disclosure names, and copy feedback.

- [x] G26: Static checks, production build, scope boundaries, and phase documentation pass review
      EVIDENCE: passed after remediation; `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --run`, `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e`, and `npm run build` passed. Vite transformed 1,940 modules. README, architecture, changelog, and this record describe the 12 MiB/2 MiB caps, complete dependency disclosure, copy behavior, and phase boundaries; comparison, saved persistence, and the full Cloudflare audit remain deferred.

### Initial Phase 3 verification record (before remediation)

- Date: 2026-10-10.
- Initial unit/component totals: 7 files, 58 tests passed.
- Initial browser totals: 13 Playwright journeys passed with system Chromium; the package-detail retry journey was repeated three times during stabilization and passed each run.
- Live package-detail smoke: `react` and scoped `@types/node` both returned HTTP 200 and rendered metadata/releases without page errors.
- Responsive review: screenshots inspected at 360×800, 768×1024, and 1280×900; no horizontal overflow. Axe reported zero violations on desktop detail and route-shell pages.
- Static/build commands passed: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --run`, `CHROMIUM_PATH=/usr/local/bin/chromium npx playwright test`, and `npm run build`.
- Phase boundary: comparison behavior, saved-package persistence, and the full Cloudflare security audit were not implemented in Phase 3.

### Phase 3 remediation verification record

- Date: 2026-10-10.
- Added exact package-identifier copy beside the detail heading. Success is announced through a polite status; clipboard failure provides an actionable alert. Component tests cover `react`, `@types/node`, and rejected clipboard writes.
- Dependency groups retain the compact first-40 presentation and expose all validated returned entries through an `aria-expanded` Show all / Show less control. Component coverage uses 45 dependencies and checks the final entry and collapse behavior.
- Added deterministic over-limit service coverage for a selected-version manifest stream above 2 MiB and a latest-only fallback manifest above 2 MiB. The selected-version stream is cancelled after the crossing chunk; it does not read the remaining chunks. The UI test verifies the terminal oversized-record error and retry action. The existing successful latest-only fallback continues to label release history unavailable.
- Added delayed-response loading-skeleton coverage and a keyboard-only browser journey for package-name copy, visible focus, dependency-group disclosure, and showing/hiding entries beyond the first 40.
- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 7 files, 67 tests, including explicit UI distinction between unavailable and empty dependency data.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 14/14 browser journeys.
- `npm run build` — passed; Vite transformed 1,940 modules.
- Responsive visual review — refreshed actual detail screenshots at 360×800, 768×1024, and 1280×900; no horizontal overflow. Axe found zero violations in the desktop detail route and route-shell checks.
- Keyboard/accessibility — verified keyboard focus reaches the copy and dependency controls, focus style is a visible 3px outline, control names are available, successful copy is announced, and failure is exposed as an alert.
- Live service smoke — `react` and scoped `@types/node` each returned mapped Registry metadata and release history through the bounded service (`full` metadata mode); both had a latest version and available release history at check time.
- No Git commit was created. Comparison, saved-package persistence, and the Cloudflare security audit remain deferred.

## Gates: PackagePulse Phase 4

Scope: comparison selection and live package metadata comparison only. Saved-package persistence and the full Cloudflare security audit remain outside this phase.

- [x] G27: Validated comparison selection is unique, capped at three, persisted safely, and usable without storage
      EVIDENCE: `comparisonStorage.test.ts` covers npm-name validation, duplicate removal, max-three recovery, names-only persistence, malformed JSON recovery, and blocked storage. Browser journeys add two and three packages and confirm persisted selection after reload. Storage key: `packagepulse:compare:v1`.

- [x] G28: Add/remove/clear/reopen interactions work from Explore, package details, and the Compare picker
      EVIDENCE: component tests verify Registry picker selection, clear, and count/persistence updates. Playwright verifies Explore selection, in-place picker selection, scoped `@types/node` detail selection, compare-tray navigation, removal, max-three feedback, and reopening package details from the comparison table.

- [x] G29: Comparison table exposes available Registry fields with real headers, safe values, and no ranking
      EVIDENCE: `ComparisonTable.tsx` uses `<th scope="col">` and `<th scope="row">`. Component tests verify metadata rows, empty versus unavailable dependency data, and loading skeletons. Weekly downloads are not requested and are explicitly omitted; different values are highlighted without a winner or quality/security score.

- [x] G30: Package and dependency requests fail/retry independently without erasing good columns
      EVIDENCE: deterministic browser journey verifies a failing package column can be retried while the successful column stays rendered and is not refetched. Component test verifies retrying a failed version-manifest dependency request does not reload either package record. Loading skeleton is checked before the delayed package responses resolve.

- [x] G31: Keyboard, accessibility, and responsive comparison experience passes
      EVIDENCE: keyboard-only Playwright journeys add and remove selection and verify visible focus. Axe reports zero violations on the rendered comparison route. Rendered screenshots reviewed at 360×800, 768×1024, and 1280×900; mobile/tablet horizontal table scroll works within its labeled region, and the page does not overflow.

- [x] G32: Full automated regression, static checks, formatting, and production build pass
      EVIDENCE: final results recorded below: 9 test files / 78 unit-component tests, 20/20 Playwright journeys, typecheck/lint/format checks and production build all pass. Phase 1–3 routes and search/detail regressions are included in the full browser suite.

### Phase 4 verification record

- Date: 2026-10-10.
- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 9 files, 78/78 unit/component tests. Comparison tests include delayed loading, storage recovery, add/clear, package failure retry, dependency-only retry, and empty/unavailable distinctions.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 20/20 Playwright journeys. Covers two/three selection, refresh persistence, scope-specific detail selection/reopen, per-column retry, keyboard add/remove, viewport scroll behavior, and Phase 1–3 regressions.
- `npm run build` — passed; Vite transformed 1,948 modules.
- Visual review used captured screenshots at 360×800, 768×1024, and 1280×900. Mobile/tablet keep the table in an internal scroll region; document overflow checks pass. Axe reported zero violations on the comparison page and across route-shell checks.
- Automated Registry responses were mocked for determinism. No separate live comparison-session smoke was run; Phases 2–3 have documented live Registry smoke records above.
- Weekly downloads are omitted because the app does not fetch them. Missing Registry fields remain unavailable; differences are not a ranking. Comparison selection stores package identifiers only. Saved-package persistence and the Cloudflare security audit were not implemented/run. No Git commit was created.

## Gates: PackagePulse Phase 5

Scope: browser-local saved package identifiers, cross-route save/remove controls, and the Saved page. Comparison behavior and the full Cloudflare security audit remain outside this phase.

- [x] G33: Versioned names-only storage validates data and recovers from unavailable, malformed, duplicate, or blocked storage
      EVIDENCE: `src/features/saved/savedStorage.ts` uses `packagepulse:saved:v1` with `{ version: 1, names }`, validates every npm identifier, deduplicates names, and catches localStorage access/read/write failures. `savedStorage.test.ts` passes 5 focused cases for scoped names, duplicate/invalid entries, malformed JSON/schema, blocked reads, and quota/write failures.

- [x] G34: Save/remove actions and saved count stay synchronized across Explore, package detail, Saved, and open tabs
      EVIDENCE: `SavedPackagesProvider` exposes shared state to the Explore result and package detail actions, the desktop/mobile header count, and `/saved`. `SavedPage.test.tsx` verifies scoped detail saving, header count, storage-event synchronization, and local-storage persistence; Playwright saves from Explore, confirms the detail button state, opens Saved, refreshes, and removes the record.

- [x] G35: Saved page presents useful Registry metadata and handles loading, missing packages, and retryable failures
      EVIDENCE: Each saved identifier is loaded through the existing `getNpmPackageDetails` service. Component coverage verifies metadata rendering, an announced loading skeleton, a retained 404/deleted package with detail route, and a retry after a network failure. Requests are aborted when a card unmounts; missing fields remain unreported rather than inferred.

- [x] G36: Empty state, browser refresh, malformed-data recovery, and storage-failure behavior remain usable
      EVIDENCE: Component tests cover the empty state after removal, malformed data recovery and rewrite, a blocked localStorage read warning, and session-only in-memory save/remove after a failed write. The Playwright save journey confirms the names-only record survives a full browser reload. The storage-event synchronization test dispatches a deterministic event in jsdom; a separate real multi-tab browser test was not run.

- [x] G37: Saved controls have keyboard-operable names and confirmation feedback; relevant pages pass responsive and accessibility checks
      EVIDENCE: `SavedPackageButton` exposes a package-specific accessible name and `aria-pressed`; the toast region announces save/remove and session-only outcomes. Keyboard-only Playwright coverage operates the scoped detail save and Saved remove controls and verifies visible focus. The rendered Explore, detail, and Saved pages were reviewed at 360×800, 768×1024, and 1280×900; Playwright confirms no horizontal overflow and Axe reports zero violations on all three routes at desktop width.

- [x] G38: Phase 1–4 regression suite and Phase 5 quality gates pass
      CHECK: `npm run typecheck && npm run lint && npm run format:check && npm test -- --run && CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e && npm run build`
      EXPECT: every command exits 0; complete unit/component and browser suites pass.
      EVIDENCE: all commands passed. Unit/component: 11 files, 92/92 tests. Playwright: 24/24 journeys, including route/search/detail/comparison regression and four Saved journeys. Production build passed; Vite transformed 1,952 modules.

### Phase 5 verification record

- Date: 2026-10-10.
- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 11 files, 92 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 24/24 journeys.
- `npm run build` — passed; Vite transformed 1,952 modules.
- Responsive review screenshots were captured and visually inspected for Saved, Explore, and scoped package detail at 360×800, 768×1024, and 1280×900. Automated document-overflow checks passed at each viewport. Axe reported zero violations on Explore, detail, and Saved at desktop width.
- Saved tests cover valid and scoped names, de-duplication, malformed JSON/schema, blocked storage reads and writes, quota failure, cross-route state, synthetic storage-event synchronization, refresh persistence, empty state, loading, deleted-package state, retryable network errors, accessible feedback, keyboard controls, and metadata rendering.
- Registry responses in new automated coverage are deterministic mocks. No new live npm API smoke was required/run in this phase.
- No Git commit was created. Comparison implementation was preserved and covered by the regression suite. The Cloudflare security audit remains deferred to the post-implementation audit phase and was not run.

## Gates: PackagePulse Phase 6

Scope: integration hardening and complete state coverage for existing Phase 1–5 functionality. Phase 7, later phases, and the Cloudflare security audit are out of scope.

- [x] G39: Route error-boundary and not-found recovery return users to Explore
      EVIDENCE: `RouteErrorBoundary.test.tsx` deliberately throws during route rendering, activates the fallback, follows “Go to Explore,” and verifies the route renders again after the location-keyed boundary remount. `NotFoundPage.test.tsx` and the Playwright not-found journey verify 404 content and Explore recovery.

- [x] G40: Important API failure, cancellation, retry, and partial-failure paths remain recoverable
      EVIDENCE: Unit/component tests cover abort/stale request suppression and typed network, malformed, 404, 429, oversized-response, selected-version, and retry states. Playwright covers stale search response suppression, 404/429 recovery, sequential network and malformed detail responses followed by successful retry, and independent comparison-column retry without losing successful metadata.

- [x] G41: URL state, navigation history, storage sync, and feedback announcements work across routes
      EVIDENCE: Playwright verifies search query restoration after reload and back/forward; scoped package direct navigation, refresh, detail navigation, and browser history; and saved-state synchronization between two real tabs. Existing UI tests and journeys verify polite toast/status and inline alert recovery paths.

- [x] G42: Registry strings and external metadata URLs are safely handled
      EVIDENCE: The Registry service tests reject unsafe protocols and credentials. `PackageDetailPage.test.tsx` injects HTML-like description/keyword values and `data:` / `javascript:` URLs, verifies strings remain literal text (no injected elements/event attributes), confirms unsafe metadata displays as unavailable, and asserts links are internal or HTTP(S). README content is not rendered.

- [x] G43: Route and key responsive states have no automated Axe violations or document overflow
      EVIDENCE: The Playwright suite analyzes all six routes at 360, 768, and 1280 CSS-pixel widths (18 Axe route/viewport runs). The route-shell journey captures all routes at those widths, asserts responsive navigation behavior, checks document width does not overflow, and collects page errors and console errors.

- [x] G44: Full automated quality suite, production build, and available live Registry smoke pass
      EVIDENCE: See the Phase 6 verification record below for final rerun counts and command outcomes. Live `getNpmPackageDetails` smoke requests returned full records for `react` and `@types/node`. The unused `PhaseNotice.tsx` component was removed after a repository-wide reference check; direct dependencies were reviewed and none was demonstrably unused.

### Phase 6 verification record

- Date: 2026-10-10.
- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 files, 95/95 unit/component tests. This includes route-boundary recovery, not-found navigation, malicious Registry strings, unsafe external links, storage failures, version/search cancellation, and retries.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 28/28 Playwright journeys. This includes all-route responsive/overflow and console checks, Axe across 18 route/viewport combinations, error-boundary and not-found recovery, scoped detail URL/history, network and malformed-response retries, 404/429 recovery, stale-search suppression, partial comparison retry, and real two-tab saved-state synchronization.
- `npm run build` — passed; Vite transformed 1,952 modules.
- Live service smoke via Vite SSR and the existing `getNpmPackageDetails` client — passed for `react` (latest `19.3.0`, 2,967 releases) and scoped `@types/node` (latest `26.6.5`, 2,381 releases); both used full metadata mode. This is a point-in-time public Registry check.
- Visual review: inspected actual route screenshots across mobile, tablet, and desktop, including the not-found recovery shell, comparison, detail, Explore, and Saved layouts. The browser suite re-captured all six route shells at 360×800, 768×1024, and 1280×900; automated overflow assertions passed. Axe ran all 18 route/viewport combinations.
- Scope: no comparison/saved feature expansion or unrelated refactor. Removed the unused `PhaseNotice.tsx`; no package dependency change was warranted. No Git commit was created. Phase 7 and the Cloudflare security audit were not started.

## Gates: PackagePulse Phase 7

Scope: accessibility, responsive, motion, and performance QA for the existing six routes and their important interactions. No Phase 8/9 work, deployment, Cloudflare security audit, or Git commit is included.

- [x] G45: All six route shells remain usable without horizontal overflow at approved review widths
      EVIDENCE: `e2e/phase7.spec.ts` visits home, Explore success, package-detail success, selected comparison, populated Saved, and not-found at 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×900, and 1440×900. Every run checks document width, visible target dimensions (minimum 44×44 CSS px), surface-border contrast, and captures a full-page screenshot. All 42 route/viewport combinations passed; captures are under ignored `test-results/playwright/phase7-*/phase7/`.

- [x] G46: Keyboard focus is visible and remains operable in the mobile navigation dialog
      EVIDENCE: Playwright verifies the Skip to content link and focused main landmark have visible 3px outlines; opening the mobile dialog focuses its close control; repeated Tab cycles remain inside; Escape closes it and restores focus to the opener. Axe reports zero violations within the open dialog. Existing keyboard journeys continue to operate search, package-name/dependency controls, comparison and saved actions.

- [x] G47: Accessible names, semantic route structure, contrast, and announced interactive states are checked
      EVIDENCE: Axe reported zero violations on all six route success states at seven approved widths (42 scans), plus the open navigation dialog, delayed package-detail loading, Explore empty/rate-limit, detail 404, comparison partial failure, and Saved empty states (49 scans total). The loading-state Axe check found the missing level-one heading; `PackageDetailSkeleton` now includes a visually hidden “Loading package details” h1, and the regression passes. Visible controls were measured at 44×44 CSS px or larger. The shared border token was raised from `#48484f` (2.16:1 against the canvas) to `#66666e`, yielding 3.44:1 against canvas, 3.35:1 against surface, and 3.12:1 against raised surface. Existing Playwright/component coverage verifies loading/status, inline error, retry, empty, toast, and selection announcements/feedback; the Phase 7 state journey runs Axe and captures screenshots for empty, rate-limit, 404, partial comparison failure, and Saved-empty states; see `e2e/search.spec.ts`, `e2e/package-detail.spec.ts`, `e2e/compare.spec.ts`, `e2e/saved.spec.ts`, and their page component tests.

- [x] G48: Reduced-motion preferences suppress skeleton animation and smooth scrolling
      EVIDENCE: `e2e/phase7.spec.ts` emulates `prefers-reduced-motion: reduce`, holds a search response to inspect the skeleton, and verifies its animation duration is effectively zero and computed scroll behavior is `auto`. Existing CSS retains the non-reduced motion presentation for other users.

- [x] G49: Production performance has repeatable measurements and any material shift found in QA is addressed
      EVIDENCE: `npm run perf:smoke` launches local Vite production preview, system Chromium 153.0.8010.12, and deterministic intercepted API fixtures. At 1280×900 it records one excluded warmup and five samples per route (home, Explore, detail, selected comparison, populated Saved, not-found), reporting median response-start, DOMContentLoaded, load end, FCP, LCP, CLS, resource bytes/count, and CDP JS heap. Across the six route medians, FCP was 184–220 ms, LCP 184–252 ms, and CLS 0.000052–0.02576; resource transfer was 154,600 bytes and heap 3.29–3.84 MB. Built JS was 344,315 bytes (102,287 gzip); CSS 48,651 bytes (9,748 gzip). The first run exposed detail-route CLS 0.11065 as the footer moved from the short skeleton into the loaded page; increasing the skeleton's reserved minimum height reduced the repeated measured median to 0.000052. This is a local, unthrottled synthetic smoke—not Lighthouse, real-user data, or a mobile-device/network measurement.

- [x] G50: Full quality suite, responsive/a11y review, browser coverage, and limitations are documented
      EVIDENCE: Final commands and counts are recorded below. All automated suites passed after the focused fixes. Only system Chromium was available; Firefox, WebKit/Safari, and Edge were not installed. No screen-reader/assistive-technology session was run. Browser fixtures are deterministic and no Phase 7 live Registry smoke was performed.

### Phase 7 verification record

- Date: 2026-10-10.
- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 files, 95/95 unit/component tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 33/33 Playwright journeys. The new Phase 7 spec passed 5/5 journeys, including the six-route × seven-width matrix, keyboard/dialog focus, delayed detail-loading accessibility, important error/empty/partial states, and reduced-motion checks.
- The six routes passed Axe at 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×900, and 1440×900 (42 route/viewport scans); the open mobile navigation dialog, delayed package-detail loading, Explore empty/rate-limit, detail 404, comparison partial failure, and Saved empty states also passed Axe (49 scans total). No route had horizontal page overflow or a measured visible control below 44×44 CSS px in those success states.
- Full-page captures were visually inspected for detail loading (1280), loaded detail (360 and 1440), comparison (360 and 768), Saved (360), Explore (1280), and not-found (1280). The complete six-route capture matrix is stored under ignored Playwright test results. The mobile/tablet comparison table scrolls within its own region as designed.
- Reduced-motion preference was verified in Chromium. Search, detail, comparison, Saved, route-recovery, error/retry, and announcement journeys passed in the existing Playwright suite. No page errors or console errors were observed by the Phase 7 route-matrix test.
- Performance: `CHROMIUM_PATH=/usr/local/bin/chromium npm run perf:smoke` — passed for six mocked routes. Median FCP 184–220 ms, LCP 184–252 ms, and CLS 0.000052–0.02576; detail CLS improved from 0.11065 to 0.000052 after the skeleton reservation adjustment. JS 344,315 bytes (102,287 gzip); CSS 48,651 bytes (9,748 gzip).
- Cross-browser limitation: no Firefox, WebKit/Safari, or Edge browser was installed; Playwright was configured and run against `/usr/local/bin/chromium` only. Automated Axe checks do not replace human assistive-technology testing.
- No live Registry request was used for performance samples; all Registry responses were deterministic route-intercepted fixtures. Results are local-machine, unthrottled laboratory observations and should not be read as field performance.
- No Git commit was created. Phases 8–10 and the separately scheduled Cloudflare security audit were not started.

## Gates: PackagePulse Phase 8

Scope: documentation, reproducible production build, dependency/lockfile review, and deployment readiness. No provider deployment, Phase 9 security audit, or Git commit is included.

- [x] G51: All repository files are accounted for despite the absence of a Git baseline
      EVIDENCE: `git status --short --branch` reports `No commits yet on main`, zero tracked files, and 84 nonignored project files, all untracked. Inventory counts: root 12, `docs/` 11, `e2e/` 6, `public/` 1, `scripts/` 1, and `src/` 53. Generated/dependency directories are ignored by `.gitignore`; `dist/`, `node_modules/`, and Playwright output were not treated as source or committed.

- [x] G52: README and architecture documentation accurately describe setup, scripts, features, API behavior, limits, and deployment requirements
      EVIDENCE: README now specifies the supported Node range, lockfile-based setup, all quality/performance commands, public Registry dependency, static `dist/` publishing, root-relative asset paths, and required SPA fallback. `docs/architecture.md` was brought up to date with Phase 7 responsive/Axe coverage. The app is a BrowserRouter/Vite SPA; it has no backend, runtime environment variables, Vite `base` override, router `basename`, or selected deployment provider.

- [x] G53: Dependency graph, lockfile, clean installation, and advisory check are consistent
      EVIDENCE: `npm ci --no-audit --no-fund` completed successfully from the regenerated lockfile; `npm ls --depth=0` showed no missing/invalid direct dependencies. `package.json` and lockfile agree on name, version, engine range, runtime dependencies, and development dependencies; lockfile v3 root metadata has no stale license field. `npm audit --json` exited 0 with 0 info, low, moderate, high, or critical advisories. The supported Node range was tightened to `^22.13.0 || ^24.0.0 || >=26.0.0`, matching the strictest current toolchain engines (Vitest/ESLint), rather than overstating Node 20 support.

- [x] G54: Production assets and routing configuration are inspected and production build succeeds
      EVIDENCE: `npm run build` passed and Vite transformed 1,952 modules. `dist/` contains `index.html`, `favicon.svg`, one hashed CSS bundle (48,651 bytes), one hashed JS bundle (344,315 bytes), and five font assets (9,520–40,896 bytes); no source maps were emitted. The HTML uses root-relative `/assets/` and `/favicon.svg`, so a root-mounted deployment is documented. No unexpected generated deployment configuration was added.

- [x] G55: Main routes and refresh work in a production-like static preview
      EVIDENCE: System Chromium 153.0.8010.12 tested direct load and browser refresh for `/`, `/explore`, `/compare`, `/saved`, encoded scoped detail `/package/%40types%2Fnode`, and an unknown route: 12/12 navigation/refresh checks returned HTTP 200, rendered the expected route heading, and emitted no console/page errors. The scoped detail API response was mocked; this verifies Vite preview's SPA fallback, not a real hosting provider.

- [x] G56: Full quality gates pass; external deployment and Phase 9 prerequisites are explicitly outstanding
      EVIDENCE: Final clean-install verification, exact test counts, asset checks, and route smoke are recorded below. No host/provider was configured and no deployment was attempted. Provider-specific rewrite, TLS, domain, caching, headers, and live-origin refresh/CORS behavior therefore remain unverified. Phase 9's Cloudflare/security audit was not run, and no commit was created.

### Phase 8 verification record

- Date: 2026-10-10.
- Verification runtime: Node.js `v24.14.1`, npm `11.11.0`, system Chromium `/usr/local/bin/chromium`.
- `npm ci --no-audit --no-fund` — passed from the final lockfile (259 packages installed).
- `npm ls --depth=0` — passed; all declared direct dependencies are present without invalid or missing entries.
- `npm audit --json` — passed, exit code 0; 0 advisories across all severities for the lockfile dependency tree at audit time.
- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 files, 95/95 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 33/33 journeys, including Phase 7 responsive/a11y/state coverage.
- `npm run build` — passed; 1,952 modules transformed. Output inventory and uncompressed bundle bytes are listed under G54; Phase 7 performance notes contain gzip figures.
- Production route/refresh smoke against `npm run preview` — passed 12/12 checks across five main routes, encoded scoped detail, and unknown route; all were direct-loaded and refreshed. Registry data used a deterministic intercepted response; no live hosting provider was exercised.
- No package versions were changed. The manifest Node engine declaration was corrected to the range supported by the complete toolchain; the lockfile was regenerated to match it. Only system Chromium was available for browser verification. No deployment, Phase 9 audit, or commit was performed.
