# PackagePulse --- Implementation Plan & Stage Gates

## Operating rule

The supplied Master Frontend Web Development Workflow is the governing
operating system. Follow its lifecycle: discover → define → map → design
→ architect → structure → style → interact → componentize → state →
integrate → accessibility → motion → SEO → test → debug → QA → optimize
→ deploy → iterate.

**Hard gate:** Do not move to the next phase until the current phase is
built, designed, functional with realistic sample data or live data as
appropriate, tested, and visually verified. If a gate fails, remain in
that phase and fix the failure. Never report a phase as complete based
only on a checklist or generated status summary.

## Resource integration requirements

Before implementation: 1. Read the entire supplied
`MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW(4).md`; use its project
intake, MVP, route inventory, design tokens, component boundaries, async
API handling, accessibility, performance, testing, visual QA, production
gate and definition-of-done sections. 2. Read `design(1).md`; adapt its
dark/warm, border-led developer aesthetic without copying its brand. 3.
Inspect the requested UI/design resources and use their actual available
guidance rather than merely name-dropping them: -
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill -
https://github.com/pbakaus/impeccable -
https://github.com/Leonxlnx/taste-skill -
https://github.com/emilkowalski/skills -
https://github.com/miqdadbadjuber/anti-slop -
https://github.com/Nutlope/hallmark 4. Inspect and apply the least-code
principles from https://github.com/DietrichGebert/ponytail. Keep code
minimal, readable and correct; do not remove necessary tests, states or
accessibility to chase a line-count reduction. 5. Inspect and apply
completion/verification guidance from
https://github.com/Leonxlnx/unlazy. Do not accept "done" claims without
checking files, running relevant commands, exercising flows and
verifying UI. 6. Before using any repository or skill, inspect its
README/license/instructions and determine the relevant scope. Do not
assume every skill is installed or that a remote repository can be
executed directly. If unavailable, record the limitation and apply
equivalent documented principles without falsely claiming it was used.
7. After the app is implemented, run the full workflow in the supplied
`SKILL(1).md` / Cloudflare security-audit-skill against the actual
repository, subject to its sandbox safety requirements. Do not run
target-controlled builds/tests unless the required isolation controls
exist. Do not audit a guessed or nonexistent path.

## Phase 0 --- Intake, repository reconnaissance and requirements lock

### Work

-   Inspect existing repository, package manager, scripts, files and Git
    status before modifying anything.
-   Read the master workflow and all project documents.
-   Verify npm Registry API endpoint shapes from official docs and real
    sample responses.
-   Confirm MVP vs should/could/not-now scope.
-   Establish a requirement-to-page/component/test traceability matrix.
-   Record assumptions, API limits and unsupported fields.
-   Inspect requested design/quality repositories as available.

### Exit gate

-   Route map and page/component inventory reviewed.
-   API endpoint/field mapping confirmed.
-   Non-goals and data-integrity rules documented.
-   No code written before requirements and visual direction are
    understood.
-   Risks and unavailable resources explicitly recorded.

## Phase 1 --- Architecture and design-system foundation

### Work

-   Initialize/inspect React + TypeScript + Vite + Tailwind + React
    Router.
-   Configure strict TypeScript, lint, formatting, tests and scripts.
-   Define domain types, error types, route structure and service
    boundary.
-   Establish CSS tokens, typography, responsive container, focus states
    and reusable primitives.
-   Build application shell and every route's structural skeleton.
-   Build a designed Home shell and representative
    Explore/detail/compare/saved shells with realistic static fixtures;
    this phase is not complete if routes are blank placeholders.

### Exit gate

-   App starts and production build passes.
-   All routes render their layout skeleton and navigation works.
-   Design tokens are centralized and the shell has been visually
    checked on mobile/tablet/desktop.
-   No unnecessary dependencies; architecture and key decisions
    documented.

## Phase 2 --- Search and discovery vertical slice

### Work

-   Implement typed npm search client/service and runtime mapping.
-   Add debounced search, Enter submit, URL query synchronization and
    cancellation/stale-response guard.
-   Implement filters/sorting only where backed by real behavior.
-   Build result cards/rows, compare action, save action and
    copy-install action.
-   Build skeleton, initial, empty, error, rate-limit and retry states.
-   Add realistic deterministic fixtures for tests; run a live smoke
    test manually where network access permits.

### Exit gate

-   Search results use real Registry API data in normal mode.
-   Query change cannot display stale results.
-   Search failure and empty results are clear and recoverable.
-   Unit/component/integration tests pass.
-   Visual QA passes at all target widths and keyboard flow works.

## Phase 3 --- Package details, versions and dependencies

### Work

-   Implement safe package-name route encoding/decoding including scoped
    packages.
-   Fetch and normalize metadata, latest version, license,
    repository/homepage, keywords, dependencies and publication dates
    where available.
-   Add release/version history from actual data.
-   Handle missing, malformed, not-found, rate-limited and partial
    metadata.
-   Keep optional download metrics isolated from core metadata if
    included.

### Exit gate

-   Detail page works for known, scoped, missing and partially populated
    packages.
-   All displayed values trace to actual API fields or are explicitly
    labeled unavailable.
-   No unsafe HTML rendering; external URLs validated.
-   Tests cover mapping and user-visible states.
-   Detail page is visually reviewed on desktop and mobile.

## Phase 4 --- Comparison vertical slice

### Work

-   Build comparison selection state and persistence if selected.
-   Enforce unique package names and a maximum of three.
-   Build accessible comparison table with real row/column headers.
-   Add independent per-package loading/error states and
    unavailable-value handling.
-   Add add/remove/reopen detail interactions and mobile table strategy.

### Exit gate

-   Two- and three-package comparisons work.
-   One failed package does not destroy other columns.
-   Zero vs unavailable is correctly represented.
-   No winner/health/security score is inferred.
-   Keyboard, mobile and comparison tests pass.

## Phase 5 --- Saved packages

### Work

-   Implement versioned storage adapter.
-   Validate/correct malformed local storage, handle blocked storage and
    quota errors.
-   Keep save status/count synchronized across routes.
-   Build saved list, first-use empty state, removal and detail
    navigation.
-   Test persistence after refresh.

### Exit gate

-   Save/remove works from result and detail contexts.
-   Saved page is accurate after refresh where storage is available.
-   Invalid storage never crashes the app.
-   Storage failure has clear graceful behavior.
-   Tests and visual QA pass.

## Phase 6 --- Integration hardening and complete state coverage

### Work

-   Exercise every route and API state end-to-end.
-   Add cancellation, retry and partial-failure coverage.
-   Verify query/route persistence and browser back/forward.
-   Confirm toast announcements and inline errors.
-   Add route error boundary and not-found handling.
-   Check external link protocols and package string rendering.
-   Remove dead code, unnecessary dependencies and duplicated logic.

### Exit gate

-   All PRD acceptance criteria have evidence.
-   No unresolved critical user-flow defects.
-   All important loading/empty/error/success/disabled/selected states
    are designed.
-   Tests pass and no unexplained console errors remain.

## Phase 7 --- Accessibility, responsive, motion and performance QA

### Work

-   Keyboard-only review for search, navigation, filters, save, compare,
    dialogs and copy.
-   Check semantics, labels, focus, live announcements, contrast and
    reduced motion.
-   Visual review at 360, 390--430, 768, 1024, 1280 and 1440 widths.
-   Cross-browser review: Chrome, Firefox, Safari and Edge as
    environment permits.
-   Inspect Network and Performance panels; fix meaningful issues
    without premature optimization.
-   Verify route titles/meta basics and direct route refresh.
-   Capture visual evidence and maintain a defect list until fixed.

### Exit gate

-   No horizontal overflow at target widths.
-   All critical interactions work by keyboard.
-   Reduced-motion preference respected.
-   Cross-browser coverage and any unavailable browsers are recorded.
-   Visual defects fixed and rechecked, not merely listed.

## Phase 8 --- Documentation, production build and deployment readiness

### Work

-   Finish README with project purpose, stack, setup, scripts,
    architecture, API source, limitations and deployment instructions.
-   Verify package manager lockfile and Git diff.
-   Run clean install only when network/dependency policy permits;
    otherwise use existing installed dependencies and document
    limitation.
-   Run typecheck, lint, formatting check, tests, production build,
    route smoke tests and dependency audit.
-   Verify SPA route fallback and refresh behavior on deployment target.
-   Commit coherent changes with meaningful messages.

### Exit gate

-   All commands pass or each failure has an explicit explanation and is
    not misrepresented as passing.
-   Production build succeeds.
-   Main routes survive direct navigation/refresh.
-   README is accurate and complete.
-   No secrets or unexpected generated artifacts committed.

## Phase 9 --- Full security audit

### Work

Use the provided security audit skill instructions (`SKILL(1).md`) and
the actual repository as target. Follow its six phases: 1.
Reconnaissance and deterministic coverage ledger. 2. Coverage-led
hunting waves. 3. Candidate validation. 4. Structured findings and
schema/coverage validation. 5. Independent verification of final
records. 6. Final report artifacts.

Review, at minimum, URL handling, external links, untrusted registry
content, unsafe HTML, local storage parsing, dependency exposure,
secrets, client-side assumptions, build/deployment configuration and
dependency risks. This is a public read-only frontend, so prioritize
real trust-boundary violations and concrete outcomes rather than
labeling every missing best practice a vulnerability.

### Safety constraints

-   Use the skill's sandboxing requirements. No live probing of deployed
    endpoints, no production testing, no secret collection, no
    uncontrolled target code execution.
-   Do not install dependencies or fetch code during the audit unless
    the skill's policy and safe environment allow it.
-   If sandbox controls cannot be enforced, do not execute
    target-controlled code; record `run_status: incomplete`, the exact
    reason, and a safe validation plan.
-   The audit must not modify application source.
-   Never claim "secure" or "audit passed" without completed evidence
    and validated outputs.

### Required audit artifacts (as required by supplied skill)

-   `run-metadata.json`
-   `architecture.md`
-   `coverage-ledger.json`
-   `findings.json`
-   `REPORT.md`
-   `FINDINGS-DETAIL.md`
-   `NEEDS-VALIDATION.md`

The skill specifies the output directory should be outside the target
repository unless the user explicitly selects an ignored in-repo
location. Confirm the path before audit execution; do not guess a
repository path.

### Exit gate

-   All Phase 6 artifacts are written and both validators pass, or the
    run is explicitly marked incomplete with exact reason and coverage
    gaps disclosed.
-   Findings distinguish `confirmed`, `needs_validation` and `rejected`.
-   No severity is assigned to `needs_validation`.
-   Final report and structured records agree.

## Phase 10 --- Final acceptance and handoff

### Work

-   Re-run critical journeys from a fresh browser session.
-   Verify all PRD acceptance criteria against the traceability matrix.
-   Review Git status and final diff.
-   Present a factual handoff: features implemented, tests run, visual
    QA coverage, audit outcome, known limitations and run/deploy
    commands.

### Final definition of done

A feature is complete only when it works, is understandable, responsive,
state-complete, accessible, tested, visually correct, acceptably
performant and maintainable. A project is not complete because the agent
says it is complete.
