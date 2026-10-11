# PackagePulse

A developer-first npm package explorer for inspecting public Registry metadata. The project is delivered in gated phases. **Phase 2** adds live npm search and discovery on Explore. **Phase 3** adds live package details, release history, selected-version dependency metadata, and install-command copy actions. **Phase 4** adds local comparison selection and a live, side-by-side metadata table. **Phase 5** adds browser-local saved packages across Explore, package details, and the Saved page. **Phase 6** hardens route recovery, API-state handling, safe metadata rendering, and cross-route verification. **Phase 7** reviews accessibility, responsive behavior, reduced motion, and production-build performance. **Phase 8** documents reproducible builds and provider-neutral static deployment requirements.

## Requirements and source documents

The supplied PRD, TRD, app flow, design brief, implementation plan, master prompt, governing frontend workflow, adapted design reference, and security-audit instructions are preserved in [`docs/source/`](docs/source/).

## Stack

React 19, strict TypeScript, Vite, Tailwind CSS 4, React Router 7, Lucide, the public npm Registry API via native `fetch`, Vitest, React Testing Library, Playwright, and Axe. No backend, credentials, or runtime data-fetching framework is used.

## Requirements

- Node.js `^22.13.0 || ^24.0.0 || >=26.0.0`. This matches the current Vite, ESLint, and Vitest engine requirements for running the complete development and test toolchain.
- npm and a browser for interactive browser journeys. Playwright Chromium binaries are managed separately from npm packages; install Chromium with `npx playwright install chromium`, or set `CHROMIUM_PATH` to a compatible system Chromium.

## Local development

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run test -- --run
npm run test:e2e
npm run build
npm run perf:smoke
npm run preview
```

To use a system Chromium, set `CHROMIUM_PATH`, for example:

```sh
CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e
```

## Search behavior and limitations

- Explore calls `https://registry.npmjs.org/-/v1/search` with URL-encoded `text`, `size`, and `from` parameters.
- Enter submits immediately; typing is debounced for 300 ms. The committed query is synchronized to `?q=…`; `keyword` and `sort` are also reflected in the URL.
- Keyword filtering and the Name / Recently published sorts operate only on the loaded results and returned metadata. Registry order is the default; Load more requests the next `from` offset.
- Requests use abort signals and a request-identity guard. Search failures distinguish network, server, rate-limit, and invalid-response cases; retry is user initiated, not automatic.
- A result can copy its `npm install` command, open the canonical public npm page derived from the validated package name, or open the package detail route. Registry-supplied `links.npm` is not used as the destination.
- Search mapping rejects a Registry page containing more package records than the requested page size (maximum 250). Descriptions are capped at 4,096 characters; at most 200 raw keyword entries are scanned and at most 100 unique keywords of 128 characters each are retained, with truncation disclosed in the UI.
- Package metadata may be missing. Weekly downloads are not requested for each result, and the app does not infer package security, maintenance, popularity quality, compatibility, or suitability.
- The public Registry may rate-limit browser requests. The interface offers an explicit retry; a specific wait duration is displayed only if the browser can read the response's `Retry-After` header.

## Package details and limits

- `/package/:name` loads the public package record from `https://registry.npmjs.org/{encoded-name}` and supports scoped package names such as `@types/node`.
- The detail page displays only validated Registry fields: package name and description, latest version, license, repository/homepage/npm links, keywords, publication date, release history, and dependency groups for the selected version. The package identifier and install command have accessible copy controls with success feedback and a clipboard-unavailable fallback.
- Full packuments are streamed with a 12 MiB body cap. Oversized responses fall back to npm's abbreviated representation (also capped at 12 MiB), then to a single latest-version manifest (capped at 2 MiB) with release history labeled unavailable. Selected version manifests are capped at 2 MiB. If a response remains too large or cannot be validated, the page reports an actionable error rather than rendering partial/untrusted JSON.
- Mapping also bounds individual field/list work: descriptions to 4,096 characters, keyword arrays to 200 scanned raw entries and 100 retained unique entries of at most 128 characters, dependency ranges to 512 characters, licenses to 256 characters, external URLs to 2,048 characters, and parsed publication dates to 64 characters. Overlong descriptions and keyword collections are visibly marked; unusably long URLs/licenses are omitted.
- Release history is mapped only up to 5,000 version entries. If a larger version map is returned, release history is explicitly unavailable while a valid latest version can still be inspected. Each dependency group is mapped up to 2,000 entries; a group that exceeds the cap is labeled partial, and Show all reveals every entry retained under that cap.
- Release dates are sourced from the Registry `time` map. An absent/empty dependency map in a valid manifest means no dependencies; missing or malformed dependency data is marked unavailable. No weekly-download requests, README HTML, or maintainer data are used.
- Dependency groups show up to 40 entries initially; when a group is larger, the Show all / Show less control makes every validated entry within the 2,000-entry mapping cap accessible. A cap reached is explicitly disclosed rather than represented as a complete group.
- External links are restricted to credential-free HTTP(S) URLs. Registry metadata is informational and does not certify package security, maintenance, compatibility, quality, or suitability.

## Package comparison

- Add packages from Explore results, package details, or the Compare page's in-place npm search. The selection is deduplicated by package identifier and capped at three.
- The current selection is stored as package names only under `packagepulse:compare:v1`. Invalid or duplicate stored entries are discarded. If browser storage is blocked, comparison remains usable for the current session and reports that it may not survive refresh.
- The comparison table uses Registry-backed latest version, license, last publication, dependency-list availability, repository, homepage, and keywords. Each package column loads and retries independently; missing metadata stays explicitly unavailable, and an empty dependency list is not conflated with unavailable dependency data.
- On mobile and tablet, the table is horizontally scrollable within its labeled, keyboard-focusable region. Differences are highlighted for scanning only; PackagePulse does not rank candidates or assign quality/security scores.
- Weekly download counts are not fetched in this phase and are omitted; the comparison page says so. No extra downloads request is made per package.

## Saved packages

- Save or remove a package from Explore results and package details. The navigation shows the live saved count, and changes are announced to assistive technology.
- The versioned `packagepulse:saved:v1` local-storage record contains only validated package identifiers. Duplicate and malformed identifiers are discarded during recovery; no package documents, secrets, or personal data are stored.
- If browser storage is blocked or a write fails, changes remain usable in memory for the current session and the Saved page explains that they may not survive a refresh. Storage events keep open tabs synchronized.
- `/saved` shows a first-use empty state or a compact saved list. Registry metadata is fetched through the existing typed npm Registry service and is optional; missing/deleted packages remain saved with a specific unavailable message and an actionable detail link. Transient failures can be retried.
- Saved entries are a personal shortlist only; they do not indicate security, maintenance, quality, compatibility, or endorsement.

## Integration and recovery

- The route error boundary recovers when navigation changes to another location, and the not-found route provides a tested return to Explore.
- Search state remains shareable in the URL and survives reload and browser back/forward; superseded searches cannot replace newer results. Package/detail and comparison failures retain their explicit retry or per-column recovery paths.
- Toasts use a polite live region for saved-state confirmations; search, Registry, dependency, and route failures use inline status or alert announcements appropriate to their state.
- Registry-provided names, descriptions, and keywords are rendered as text, never raw HTML. External metadata links are retained only for credential-free HTTP(S) URLs.
- Saved-package storage synchronization is covered with two real browser tabs. The full browser suite checks all six routes at mobile, tablet, and desktop sizes and runs Axe at each route/size combination.

## Phase 7 QA record

- All six routes were visually captured and checked at 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×900, and 1440×900. Playwright found no document overflow or visible interactive target smaller than 44×44 CSS px in the tested success states. Axe reported zero violations across 42 route/viewport combinations, the open mobile navigation dialog, delayed package-detail loading, Explore empty/rate-limit, detail 404, comparison partial-failure, and Saved-empty states.
- Keyboard checks cover skip-link/main focus visibility, mobile-dialog focus containment and Escape restoration, plus existing keyboard search, copy, dependency disclosure, comparison, and saved-package journeys. Reduced-motion emulation verifies skeleton animation and scrolling preferences.
- `npm run perf:smoke` runs Chromium against the local production preview with mocked Registry responses: one warmup then five measurements per route. It reports navigation timings, FCP/LCP/CLS, resource totals, JavaScript heap, and asset sizes. This is a deterministic local smoke rather than Lighthouse, throttled-device, or field data. Phase 7 recorded median FCP 184–220 ms, LCP 184–252 ms, CLS 0.000052–0.02576; JS 344,315 bytes (102,287 gzip) and CSS 48,651 bytes (9,748 gzip). The measured detail-page CLS regression was reduced by reserving more skeleton height.
- Only system Chromium was available. Firefox, WebKit/Safari, Edge, and manual screen-reader testing were unavailable; refer to `GATES.md` for full commands, evidence, and caveats.

## Static deployment readiness

- Build with `npm ci && npm run build`; publish the contents of `dist/` at the domain root. The built HTML references root-relative `/assets/` and `/favicon.svg`, and the app currently has no Vite `base` override or React Router `basename`; deployment under a URL subpath is not configured.
- Configure the static host's SPA/history fallback so direct requests and refreshes for client routes such as `/explore`, `/compare`, `/saved`, and `/package/%40types%2Fnode` return `index.html` with HTTP 200. Serve real files under `/assets/` and `/favicon.svg` normally. The client then renders its own not-found route for unknown application paths.
- `npm run preview` serves the built output locally and was used to test direct route loads and refreshes. It is a production-like local check, not a hosting-provider deployment.
- The app has no backend or runtime environment variables. Browser sessions call the public npm Registry directly; users' browsers need access to `https://registry.npmjs.org`, and search/detail behavior remains subject to Registry availability and rate limits.
- No hosting provider is configured or deployed. Provider-specific rewrite rules, TLS/custom-domain configuration, caching, response headers, and production-origin refresh behavior remain to be verified after a host is selected. Do not treat the local preview smoke as deployed verification.

The full Cloudflare security audit remains scheduled for the post-implementation audit phase.

See [`docs/architecture.md`](docs/architecture.md) and [`GATES.md`](GATES.md) for boundaries and verification evidence.
