# PackagePulse --- Design Brief & Visual System

## 1. Creative direction

**Direction:** "A precision instrument for dependency research."\
PackagePulse should feel engineered, tactile, confident and useful---not
like a generic SaaS dashboard assembled from interchangeable cards.

Use the supplied ECC design reference as a starting point only: midnight
dark surfaces, warm peach/coral accents, Exo 2 headings, restrained
geometry, clear borders, compact technical details and low-shadow
surfaces. Give PackagePulse its own identity through package-specific
data visualization, carefully structured comparison tables, editorial
hierarchy and a distinctive search/workbench composition.

### Desired feeling

-   Developer-first and technically literate.
-   Calm under information density.
-   Premium without glossy effects.
-   Clear about evidence and uncertainty.
-   Designed around reading and comparing real metadata.

### Avoid

-   Generic purple/blue gradients, neon glows, glassmorphism and heavy
    drop shadows.
-   Repeated identical rounded cards for every section.
-   Fake statistics, fake user counts, fake "health scores", fake
    testimonials or invented package popularity.
-   Decorative charts with no trustworthy data.
-   Oversized hero typography that pushes the actual search utility
    below the fold.
-   Unnecessary animation or motion that delays interaction.
-   Copying ECC logos, exact marketing language or screenshots.

## 2. Brand concept

-   **Name:** PackagePulse
-   **Brand mark:** Custom typographic wordmark with a restrained
    pulse/registry motif; avoid a medical-monitor metaphor that implies
    package safety scoring.
-   **Voice:** Precise, pragmatic, concise, transparent.
-   **Tagline direction:** "Inspect the details before you install."
-   **Product promise:** "Explore public npm metadata in one focused
    workspace."
-   **Trust language:** "Data from the public npm registry. Metadata may
    be incomplete." Do not imply security verification.

## 3. Color tokens

Base palette adapts the supplied design file: - `--pp-bg: #0B0B14` ---
main midnight canvas. - `--pp-surface: #0F0F18` --- raised/secondary
surface. - `--pp-surface-2: #171722` --- additional layer only when
needed. - `--pp-text: #F3EEF0` --- primary readable text (improve
contrast over the reference's warm body text where necessary). -
`--pp-text-warm: #EBC1B5` --- warm headline/link accent. -
`--pp-primary: #E9B4A5` --- primary action coral/peach. -
`--pp-accent: #E07856` --- active/secondary accent. -
`--pp-border: #48484F` --- border and dividers. - `--pp-muted: #B7AFB5`
--- secondary text; verify contrast for actual size. - `--pp-success`,
`--pp-warning`, `--pp-danger`, `--pp-info` --- semantic colors chosen
and contrast-checked; do not rely on color alone.

Primary CTA: peach fill with dark readable text. Secondary CTA: dark
surface, subtle border, light text. Use coral sparingly for emphasis,
active selection and focus details. No glossy gradients or neon effects.

## 4. Typography

-   Primary typeface: Exo 2, consistent with the supplied reference;
    include a reliable system fallback and avoid excessive weights.
-   Code/package identifiers: system monospace stack.
-   Establish a responsive scale using `clamp()` for the hero and major
    headings.
-   Suggested hierarchy:
    -   Display/hero: 44--60px desktop, fluid down to 34--40px mobile.
    -   Page title: 30--40px.
    -   Section title: 18--24px.
    -   Body: 14--16px with comfortable line-height.
    -   Metadata/caption: 12--13px; never use low-contrast tiny text for
        important facts.
-   Package names and version numbers should be easy to scan and copy.
-   Avoid making all text compact simply because the audience is
    technical.

## 5. Shape, spacing and depth

-   Base spacing unit: 4px.
-   Radius: 10px core radius for controls/cards, consistent with
    reference; smaller radius only for small labels where it improves
    fit.
-   Border-led hierarchy; use shadows rarely and subtly.
-   Content max width: choose a consistent wide container suitable for
    tables and search results; avoid full-bleed text lines.
-   Use asymmetry intentionally: a strong left-aligned search headline
    paired with a custom metadata preview/workbench on desktop.
-   Dense content should be separated by spacing, labels and table
    structure---not endless nested cards.
-   Create tokens for spacing, radii, borders, focus ring, typography
    and z-index before page-specific styling.

## 6. Signature layouts

### Home

-   Compact top navigation.
-   Hero headline: direct, technical, outcome-led.
-   Prominent search input integrated into a distinctive
    "command/workbench" panel.
-   Beside or below search, a custom preview that resembles actual
    PackagePulse results/detail metadata---not generic abstract blobs.
-   A short "Search → Inspect → Compare → Save" flow.
-   Small transparency note about public metadata.
-   Below the fold: concise capability sections with varied composition,
    not a repetitive grid of equal cards.

### Explore

-   Search remains visible near the top.
-   Left rail or compact filter row at desktop; filters collapse into a
    clear mobile control.
-   Result rows/cards prioritize package name, description, version and
    relevant metadata.
-   Avoid cluttering every row with every field; use hierarchy and
    progressive disclosure.
-   Comparison selection is visible but does not obscure content.

### Package detail

-   Clear identity header and install command panel.
-   Quick facts in a structured grid.
-   Version history and dependencies are content-first sections.
-   Long dependency lists use disclosure/expand behavior.
-   Missing data is presented as a neutral "Not provided" rather than a
    blank or misleading zero.

### Compare

-   Table is the visual center, not a pile of cards.
-   Sticky package header row only if it remains usable on small
    screens.
-   Highlight differences with subtle background/edge treatment.
-   On mobile, allow horizontal table scrolling with a clear cue or
    transform into labeled comparison groups without losing field/value
    relationships.

### Saved

-   Compact list of saved packages with meaningful metadata and obvious
    reopen/remove actions.
-   Explain browser-local persistence in a small, unobtrusive note.

## 7. Component styling rules

-   Buttons: clear hierarchy, 10px radius, consistent heights, visible
    hover/active/focus/disabled states.
-   Inputs: strong contrast, persistent label, clear focus ring,
    keyboard-friendly clear action.
-   Cards: use only where they group a coherent entity; border-led and
    low-shadow.
-   Badges: use sparingly for version/license/status metadata; never
    present a "safe" or "healthy" badge.
-   Tables: high readability, clear row headers, responsive overflow
    handling.
-   Skeletons: match the approximate final content geometry to reduce
    layout shift.
-   Errors: plain-language message + recovery action; no cryptic codes
    as the main message.
-   Empty states: explain why empty and give the next action.
-   Icons: Lucide, consistent stroke weight, always pair ambiguous icons
    with text or accessible labels.
-   Toasts: brief and non-blocking; do not use toast-only errors for
    important failures.

## 8. Motion system

-   Purposeful transitions for button states, mobile navigation, result
    appearance and expand/collapse.
-   Most transitions should be around 120--220ms; no motion that blocks
    a task.
-   No perpetual decorative animation.
-   Respect `prefers-reduced-motion`.
-   Avoid large page transitions that delay search or route interaction.

## 9. Responsive behavior

Define breakpoints based on content needs, not arbitrary device labels.
Test at minimum: - 360px narrow mobile - 390--430px typical mobile -
768px tablet - 1024px laptop/tablet landscape - 1280px desktop - 1440px
wide desktop

Rules: - No horizontal page overflow. - Header navigation collapses
predictably. - Result metadata wraps or hides lower-priority details
without clipping. - Comparison table has a tested mobile strategy. -
Filter controls remain reachable. - Tap targets are comfortable. -
Typography and gutters scale fluidly. - Dialogs fit within the viewport
and keep focus visible.

## 10. Accessibility and contrast

-   WCAG-minded contrast checks for text, borders and focus indicators.
-   Semantic landmarks and proper heading hierarchy.
-   Focus-visible style that is obvious on dark surfaces.
-   Keyboard operation for navigation, search, filters, selection, menus
    and dialogs.
-   Reduced-motion support.
-   Screen-reader announcements for async results and action feedback.
-   Color is never the only indicator of selected, different, error or
    success states.

## 11. Visual QA checklist

Inspect actual screenshots/browser rendering at all agreed viewport
sizes: - Hierarchy and first-screen composition. - Typography, line
lengths and contrast. - Alignment, gutters, density and spacing
rhythm. - Search/result/detail/compare/saved consistency. - Skeletons
match content geometry. - Missing/error/empty states feel designed, not
forgotten. - Mobile menus and tables do not overflow. - Focus, hover,
active and disabled states. - Icons and labels are consistent. - No fake
metrics, empty decorative charts or unsupported claims. - Reduced motion
behaves correctly.

A page is not approved solely because it builds or "looks okay" in one
screenshot. Compare against this brief, record issues, fix them, and
repeat.
