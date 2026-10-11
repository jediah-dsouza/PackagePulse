# PackagePulse --- Application Flow & Information Architecture

## 1. Global navigation

Desktop header: - PackagePulse brand → `/` - Explore → `/explore` -
Compare → `/compare` with selected count - Saved → `/saved` with saved
count - Optional global search shortcut only if documented and
accessible.

Mobile: - Brand and menu button in compact header. - Menu opens a
semantic navigation panel; Escape closes it, focus returns to trigger,
and route selection closes the menu. - Search remains easy to reach on
Home and Explore.

## 2. Route map

``` text
/
├── /explore?q=<query>
│   └── /package/:encodedName
├── /compare
├── /saved
└── * (Not Found)
```

Cross-cutting systems: - npm Registry service - optional downloads
service - saved-package storage - comparison-selection storage -
toast/live announcement region - route-level error boundary

## 3. Primary journey --- search and inspect

``` text
Home
  → Enter package name or keyword
  → Submit / debounce
  → Explore loading skeleton
  → Results / no results / API error
  → Select result
  → Package detail loading state
  → Detail success / package not found / retryable error
  → Inspect facts, dependencies and release information
  → Save, copy install command, or add to comparison
```

Failure branches: - Network error: preserve query, show retry. - Rate
limited: explain that the registry is temporarily limiting requests;
avoid a tight automatic retry loop. - No results: preserve query and
suggest editing it. - Partial metadata: render known fields and label
missing fields as unavailable. - Package not found: show a
package-specific not-found state with a search-again action.

## 4. Comparison journey

``` text
Explore result or detail page
  → Add package to compare
  → Compare tray reflects selection
  → Add second package
  → Compare CTA becomes available
  → /compare
  → Fetch/resolve package metadata
  → Comparison loading state
  → Table of 2–3 packages
  → Remove package / add another / open detail
```

Rules: - Reject duplicate package names. - Cap selection at three and
explain the limit. - With zero or one package, show a designed
empty/guidance state. - If one package request fails, keep the
successful columns and show the failed package's error/retry in its
column. - Highlight differences only to aid scanning; do not declare a
winner. - Unknown and zero are separate states.

## 5. Saved package journey

``` text
Any package card/detail
  → Save package
  → Save state updates immediately
  → Accessible toast announces saved
  → Saved count updates in header
  → /saved
  → Saved package list
  → Open detail or remove saved item
  → Refresh browser
  → Saved items remain if localStorage is available
```

Storage failure: - Keep in-memory functionality for the current session
where possible. - Tell the user that persistence is unavailable without
exposing technical stack traces. - If stored JSON is malformed, recover
safely and do not crash the app.

## 6. Search state machine

``` text
idle (no query)
  └─ user types/submits → loading
loading
  ├─ valid results → success
  ├─ zero results → empty
  ├─ request fails → error
  └─ query changes → abort/ignore stale response, then loading
success
  ├─ load more → loading-more
  ├─ filters change → derived filtered results or new request, as appropriate
  ├─ query changes → loading
  └─ retry → loading
error
  ├─ retry → loading
  └─ edit query → loading
empty
  ├─ edit query → loading
  └─ clear query → idle
```

The rendered state must never show a spinner indefinitely. Every request
must resolve, fail, or be canceled.

## 7. Package detail state machine

``` text
route entered
  → loading skeleton
  ├─ metadata available → success
  ├─ 404 → not found
  ├─ 429 / 5xx / network → error with retry
  └─ partial response → success with unavailable-field fallbacks
```

Optional downloads: - Fetch independently from metadata. - Show its own
loading/error/unavailable state. - Do not fail the entire page if
download counts are unavailable.

## 8. Comparison state model

Each selected package has its own state: - `loading` - `success` -
`not-found` - `error`

Table rows are derived from normalized package records. Each cell is one
of: - available value - not provided - not returned - request failed

This is necessary so the interface does not conflate a real `0`
dependency count or `0` downloads with missing data.

## 9. App-level feedback and navigation

-   Every successful save/remove/copy action produces unobtrusive
    feedback.
-   Async errors appear near the relevant content, not only in a toast.
-   Toasts use an accessible live region and are not the only source of
    important error information.
-   Route transitions preserve expected query/selection state.
-   Back navigation should return to the previous search query when
    feasible.
-   A skip link moves focus to main content.
-   On navigation to a new route, document title should be updated
    appropriately.

## 10. Interaction matrix

  -----------------------------------------------------------------------
  Interaction             Feedback                Error/edge case
  ----------------------- ----------------------- -----------------------
  Type search             Debounced request /     Cancel stale request
                          pending indicator       

  Submit search           URL/query updated       Empty query shows
                                                  guidance

  Open package            Detail skeleton         404 and retryable
                                                  errors differ

  Save package            Button state + toast    Storage unavailable

  Add to compare          Tray/count updates      Duplicate / max three

  Remove compare          Column/tray updates     Fewer than two returns
                                                  to guidance

  Copy install command    "Copied" status         Clipboard permission
                                                  failure

  Load more               Inline loading          No more results /
                                                  request failure

  Retry                   Region returns to       Bounded retry; no
                          loading                 infinite loop

  Mobile menu             Expanded/collapsed      Escape and focus
                          state                   restoration

  External link           Opens intended valid    Invalid protocol
                          destination             rejected
  -----------------------------------------------------------------------

## 11. URL and browser behavior

-   `/explore?q=react` must restore the search term after refresh.
-   Scoped package route handling must be tested for `@scope/name`.
-   Direct route refreshes must work in the deployed SPA.
-   Saved and compare state may persist locally but must remain usable
    if localStorage is disabled.
-   Back/forward navigation should not leave stale search results
    visible for a different query.
