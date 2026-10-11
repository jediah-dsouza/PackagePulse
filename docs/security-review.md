# PackagePulse static security review follow-up

**Review scope:** targeted remediation for the source-only security review of npm
Registry metadata handling. This document does not represent a complete security
audit, Cloudflare audit, deployment review, or proof that the application is
secure.

## Result

The previously identified misleading npm-page destination and agreed NV-2
hardening follow-ups are implemented and tested. Registry mapping and rendering
use explicit cardinality and field-size bounds, and disclose omitted or
truncated data. No new confirmed vulnerability was identified. This remains a
targeted source-review follow-up, not a complete audit.

## Findings and disposition

| Item | Prior concern                                                                                                                                                   | Current status                                 | Evidence and disposition                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NV-1 | Search result action trusted Registry-provided `links.npm` metadata, which could point to an unrelated HTTP(S) destination while being labeled as the npm page. | **Closed**                                     | `src/services/npmRegistry/npmRegistryService.ts:373-399` constructs the npm page from the validated package name on `www.npmjs.com`; it does not use `links.npm`. Service and Explore tests cover misleading-host, `javascript:`, credential-bearing metadata, and scoped names.                                                                                                                                                                                  |
| NV-2 | Search/package metadata arrays and strings could cause avoidable mapping or rendering work within otherwise bounded response bodies.                            | **Closed for the agreed targeted remediation** | `stringList` scans at most 200 raw entries before filtering/deduplication and reports omitted data; `normalizeString` and dependency-range mapping check length before trimming obvious oversized unpadded strings. `ComparisonTable` distinguishes omitted-only keywords from genuinely absent keywords. Tests cover duplicate, invalid, and overlong entries beyond the raw cap, padded valid strings, dependency-range boundaries, and both comparison states. |

## Current bounds

- Search and selected-version response bodies remain capped at 2 MiB; full and
  abbreviated package records remain capped at 12 MiB.
- Search result object count cannot exceed the normalized requested page size
  (maximum 250); larger arrays produce the existing invalid-response error and
  retry state.
- Descriptions are capped at 4,096 characters and display a shortening notice.
- Keyword mapping scans at most 200 raw array entries before filtering or
  deduplication, retains at most 100 unique terms of at most 128 characters,
  and discloses omitted Registry keyword entries, including when no valid terms
  remain to display.
- Version history maps up to 5,000 entries. Above that threshold, release
  history is unavailable with a specific explanation; latest-version details
  remain available when valid.
- Each dependency group maps up to 2,000 entries. More entries cause a partial
  status and explicit notice. The existing Show all control exposes every
  retained validated entry; it cannot expose entries intentionally excluded by
  the cap.
- Dependency ranges are limited to 512 characters. Obvious oversized unpadded
  values are rejected before trimming; edge-padded values are trimmed normally
  to preserve valid input behavior.
- External URLs are limited to 2,048 characters and still must pass the
  existing credential-free HTTP(S) protocol validation. Licenses are limited
  to 256 characters; publication date strings to 64 characters.

## Verification performed for this follow-up

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run format:check` — passed.
- `npm test -- --run` — passed; 13 test files, 112 tests.
- `CHROMIUM_PATH=/usr/local/bin/chromium npm run test:e2e` — passed; 33/33
  Playwright tests using deterministic route-intercepted fixtures.
- `npm run build` — passed; 1,952 modules transformed. The bundle was
  approximately 346.76 kB JavaScript and 48.65 kB CSS (uncompressed Vite
  output).

The automated tests used bounded synthetic fixtures. No live npm Registry
request, hostile production payload, deployment environment, or hosting headers
were tested as part of this follow-up.

## Remaining limitations and validation

- `JSON.parse` still processes each response synchronously after its bounded
  body has been read. The collection limits bound subsequent mapping and UI
  work; this follow-up did not run an adversarial CPU/heap stress benchmark.
- Edge-padded oversized string fields still use the regular trim path so that
  valid whitespace-padded values retain their prior behavior. Response-body
  byte limits bound the maximum input, but parsing/trim work remains
  synchronous.
- More than 5,000 package versions or 2,000 dependencies in one group are
  intentionally not fully represented. The page labels those states rather
  than presenting the retained data as complete.
- Saved-package identifiers remain a browser-local, user-controlled list with
  no newly introduced cardinality limit. The prior review found no external
  attacker-controlled path into that list; this is recorded as a local
  scalability consideration, not a confirmed vulnerability.
- Provider-specific security headers, deployed-origin routing, TLS, and
  production behavior remain unverified because no hosting environment was
  used.
- This work does not replace the separately scheduled Cloudflare security
  audit or a future live/deployment security review.
