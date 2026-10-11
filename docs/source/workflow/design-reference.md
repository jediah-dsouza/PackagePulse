# Design System: ECC

## 1. Visual Theme & Atmosphere

ECC presents as a dark, developer-first product brand with a premium, technical, slightly futuristic feel. The page combines strong social proof, product documentation cues, and operational tooling language into a polished, utility-driven experience.

- Overall feeling: Modern, engineered, confident, and practical
- Visual density: Medium to high; content-rich but organized into clear sections and cards
- Brand posture: Authority through proof, adoption metrics, and workflow specificity
- Signature motifs: Dark canvas, warm peach/orange accents, compact UI chips, code snippets, and proof-heavy storytelling

### Key Characteristics

- Dark mode-first presentation with warm, high-contrast accent colors
- Exo 2 typography across headings, body, and UI labels
- Rounded 10px UI geometry with restrained shadows
- Product storytelling anchored in workflows, metrics, and trust signals

## 2. Color Palette & Roles

| Role | Semantic Name | Value | Usage |
| --- | --- | --- | --- |
| Primary action | Soft Coral | #E9B4A5 | Primary CTA fills, brand emphasis, key highlights |
| Accent | Ember Orange | #E07856 | Secondary brand accent, attention states, supporting emphasis |
| Surface | Midnight Navy | #0B0B14 | Main page background |
| Text | Warm Rose Text | #EBC1B5 | Primary text and link color on dark surfaces |
| Border | Slate Border | #48484F | Secondary button borders, neutral dividers |

### Primary

- Soft Coral (#E9B4A5) is the main action and brand color
- Ember Orange (#E07856) supports the primary palette with a warmer, stronger accent

### Interactive

- Links use Warm Rose Text (#EBC1B5), matching the main text tone
- Primary CTA uses coral fill with dark text for strong contrast
- Secondary CTA uses a dark fill with muted border and light text
- Hover/focus specifics are not explicitly evidenced; likely subtle due to the restrained shadow language

### Neutral Scale

- Midnight Navy (#0B0B14) functions as the dominant dark neutral background
- Secondary dark surface appears as #0F0F18 on secondary buttons
- Slate Border (#48484F) provides the clearest neutral edge treatment in the evidence

### Surface & Overlay

- Main surface: #0B0B14
- Elevated dark surface: #0F0F18
- No explicit overlay, blur, or glass token was observed in the evidence

### Theme Modes

If the product supports light and dark appearance modes, document both explicitly rather than collapsing them into one blended palette.

#### Light Mode

- Background: Not evidenced
- Surface: Not evidenced
- Text: Not evidenced
- Accent: Not evidenced
- Notes: Available evidence only shows a dark theme scheme

#### Dark Mode

- Background: #0B0B14
- Surface: #0F0F18
- Text: #EBC1B5
- Accent: #E9B4A5 / #E07856
- Notes: Dark mode is explicitly indicated by Firecrawl branding; this is the observed mode

### Shadows & Depth

- Borders/rings appear more important than shadow elevation
- Primary and secondary buttons show no shadow
- Focus treatment is not directly observed; likely minimal and ring-based if present

## 3. Typography Rules

### Font Family

- Primary: Exo 2
- Monospace: Not explicitly identified; code blocks appear monospace by convention, but the font family was not provided
- OpenType Features: Not evidenced

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Hero headline | Exo 2 | 61.6px | Not specified | Not specified | Not specified | Large landing-page headline; highly prominent |
| Section heading | Exo 2 | 12px | Not specified | Not specified | Not specified | Evidenced as a compact heading size; likely used for small labels/eyebrows in the captured data |
| Body | Exo 2 | 13.6px | Not specified | Not specified | Not specified | Primary paragraph size from branding data |
| Label / Eyebrow | Exo 2 | Not specified | Not specified | Not specified | Not specified | Likely compact, uppercase/short-label treatment based on page structure |
| Caption / Meta | Exo 2 | Not specified | Not specified | Not specified | Not specified | Used for supporting measurements, citations, and metadata-like content |

### Principles

- Typography is compact and utility-oriented rather than editorial
- Headings are bold in presence, but the system avoids excessive stylistic flourish
- Exo 2 reinforces a technical, modern, engineering-oriented tone

## 4. Component Stylings

### Buttons and Links

- Primary CTA: Coral fill (#E9B4A5), dark text (#241716), 10px radius, no shadow
- Secondary CTA: Dark fill (#0F0F18), light text (#F3EEF0), Slate Border (#48484F), 10px radius
- Text links: Warm Rose Text (#EBC1B5), visually integrated with body copy
- Hover and active feel: Not explicitly observed; likely subtle, with emphasis on contrast and border clarity rather than motion

### Cards and Containers

- Surface style: Dark cards and panels on a near-black background
- Radius: 10px
- Border: Neutral border treatment is present in components; likely used sparingly for separation
- Shadow or elevation: None observed on buttons; the system appears low-shadow and border-led
- Internal spacing: Compact, with consistent rhythmic spacing likely driven by a 4px base unit

### Inputs and Interactive Controls

- Input treatment: Not directly evidenced, but terminal/code-style snippets suggest compact, high-clarity controls
- Focus behavior: Not observed
- Selection states: Not observed

### Navigation

- Structure: Top-level skip link, then a dense single-page narrative with section anchors and CTA links
- Background treatment: Integrated into the dark page background
- Link style: Text links in warm rose tones; external-link indicators used in CTA copy
- Sticky or scroll behavior: Not evidenced

### Image Treatment

- Screenshot treatment: Product imagery is embedded directly into content sections as supporting proof
- Photography or illustration style: Mix of product screenshots, logos, and branded media rather than decorative illustration
- Border and radius treatment: Not explicitly evidenced; images appear integrated into the page flow with minimal framing

### Distinctive Components

- Metric-rich proof blocks for installs, downloads, stars, and usage counts
- Guided setup / installation command presentation with code-formatted snippets
- Workflow modules such as Plan Canvas, Control Pane, Unified Memory, and AgentShield
- Social proof sections using logos, quotes, and team/customer references

## 5. Layout Principles

### Spacing System

- Base unit: 4px
- Repeated spacing values: Likely multiples of 4px, with 10px radius used as a distinct design constant

### Grid & Container

- Grid logic: Single-page, sectioned layout with stacked modules and recurring two-column content patterns where needed
- Max content width: Not explicitly observed
- Section spacing: Medium-to-generous vertical spacing between narrative sections

### Whitespace Philosophy

- Whitespace philosophy: Enough breathing room to separate dense technical content, but not minimalistic in the sparse sense
- Alignment tendencies: Left-aligned, text-first, with visual evidence embedded alongside copy
- Content width behavior: Comfortable reading width with broad sections and clear segmentation

### Border Radius Scale

- Micro: 10px appears to be the core rounding value even for smaller controls
- Standard: 10px
- Large: Not explicitly evidenced, but likely consistent with the standard token
- Pill: Not evidenced

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | Dark surfaces with no shadow | Main page background, text sections |
| Ring | 1px+ neutral border in Slate Border | Buttons, subtle separation, control framing |
| Card | Slightly differentiated dark surface, minimal elevation | Content modules and product panels |
| Focus | Not explicitly evidenced; likely high-contrast ring or border state | Keyboard focus and interactive affordances |

### Depth Principles

- Surface hierarchy: Built primarily through color contrast, not heavy shadow
- Shadow language: Very restrained; buttons explicitly have none
- Blur, glass, or overlay behavior: Not evidenced
- When depth is used versus avoided: Depth appears only where it supports clarity; decorative elevation is avoided

## 7. Do's and Don'ts

### Do

- Use the dark midnight background with warm peach text and coral CTAs
- Keep UI geometry rounded but restrained at 10px
- Prioritize proof, workflow clarity, and technical credibility in layouts

### Don't

- Don’t introduce glossy gradients, neon effects, or heavy shadows
- Don’t replace the warm coral palette with cold blue brand colors
- Don’t over-ornament the interface; keep it utility-led and content-first

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
| --- | --- | --- |
| Mobile | Not evidenced | Stack sections vertically, prioritize CTA and headline visibility |
| Tablet | Not evidenced | Maintain section stacking with selective two-column compositions |
| Desktop | Not evidenced | Use wider multi-module layouts, richer proof sections, and side-by-side media |

### Touch Targets

- Keep interactive elements comfortably tappable; 10px radius buttons imply compact but usable controls
- Preserve generous vertical spacing for long-form technical content on smaller screens

### Collapsing Strategy

- Desktop behavior: More expansive section compositions, richer evidence blocks, and side-by-side content where helpful
- Tablet behavior: Reduce column count and preserve the reading flow
- Mobile behavior: Stack everything into a linear narrative with clear CTA hierarchy
- Breakpoint-driven component changes: Likely collapses metric tables, proof grids, and media panels into single columns
- Touch target and spacing adjustments: Maintain readable line length and add vertical breathing room for code blocks and installation links

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: #E9B4A5
- Background: #0B0B14
- Heading text: #EBC1B5
- Body text: #EBC1B5
- Border or ring: #48484F
- Accent: #E07856

### Quick Summary

ECC is a dark-mode-first developer product with a warm coral/orange brand palette, Exo 2 typography, and a compact utility aesthetic.  
The design feels modern, credible, and highly technical, with strong emphasis on workflow clarity and proof.  
Primary CTAs are coral with dark text; secondary actions are dark with neutral borders.  
Borders and contrast matter more than shadows or decorative depth.  
Sections are content-dense but organized, often mixing narrative, metrics, code snippets, and logos.  
Overall tone: engineered, practical, and authoritative for developers and engineering teams.

### Example Component Prompts

- Hero: Create a dark hero section with Exo 2 type, a large technical headline, warm rose body text, and a coral primary CTA beside a dark secondary CTA.
- Card: Build a rounded 10px dark card with a subtle border, compact spacing, and no shadow; keep the content proof-oriented and text-first.
- Navigation: Use minimal, text-led navigation with warm rose links on a dark background and a simple skip-link accessibility pattern.
- Button or badge: Use a soft coral filled button with dark text and 10px radius, or a dark secondary button with a slate border and light text.

### Ready-to-Use Prompt

Design a dark, developer-focused ECC-style interface using Exo 2, a midnight background, warm rose text, coral primary actions, subtle bordered dark surfaces, and compact proof-driven content blocks with minimal shadow.

### Iteration Guide

1. Keep the palette dark, warm, and restrained; do not add bright blues or flashy gradients.
2. Preserve compact technical typography and rounded 10px controls.
3. Favor evidence, metrics, and workflow clarity over decorative UI.

## Optional Appendix: Interaction Patterns

- Scroll behavior: Long-form landing page sections stacked vertically
- Hover behavior: Not explicitly observed; likely subtle border/contrast changes
- Click behavior: Clear external-link CTAs and section jump links
- Animation tone: Not evidenced; overall feel suggests minimal, functional motion

## Optional Appendix: Content & Messaging Patterns

- Headline pattern: Strong declarative positioning followed by operational explanation
- CTA language: Action-oriented and tool-specific, such as install, explore, open, and compare
- Trust signal pattern: Metrics, logos, known engineering brands, and direct quotes
- Voice and tone: Technical, confident, precise, and pragmatic

## Optional Appendix: Observed Pages

- Home page (https://ecc.tools/): Primary brand palette, typography, button styling, and overall landing-page structure
- GitHub App / toolkit sections: Workflow-oriented module patterns and CTA styling
- Pricing / plans references: Plan-card structure and value framing
- Security / AgentShield section: Security product messaging and proof-led presentation