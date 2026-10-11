# MASTER FRONTEND WEB DEVELOPMENT WORKFLOW

> **The Sigma Web Development Course is the foundation.
> This workflow is the operating system.**

A practical, reusable workflow for building frontend applications from idea to production.

This document is intentionally **frontend-first**.

It covers:

* Product and UX thinking
* Information architecture
* UI architecture
* HTML
* CSS
* Responsive design
* JavaScript
* Browser APIs
* React
* Next.js frontend concepts
* State management
* API/data consumption
* Forms
* Accessibility
* Animation and interaction
* SEO
* Performance
* Testing
* Debugging
* Visual QA
* Git
* Deployment
* Production readiness

It does **not** turn backend development into a hidden requirement.

---

# 0. HOW TO USE THIS WORKFLOW

Do not treat this as a checklist that must be completed mechanically for every project.

Treat it as a **decision system**.

The workflow answers:

> **What should I think about, build, verify, and improve next?**

For small projects, many stages can be lightweight.

For large applications, every stage becomes explicit.

---

# 1. THE FRONTEND MASTER MENTAL MODEL

Every frontend project can be understood as:

```text
IDEA
 ↓
USER / PRODUCT
 ↓
USER GOALS
 ↓
USER FLOWS
 ↓
INFORMATION ARCHITECTURE
 ↓
PAGE / ROUTE MAP
 ↓
CONTENT / UI MODEL
 ↓
DESIGN DIRECTION
 ↓
DESIGN SYSTEM
 ↓
UI STRUCTURE
 ↓
SEMANTIC HTML
 ↓
CSS / RESPONSIVE LAYOUT
 ↓
JAVASCRIPT INTERACTION
 ↓
REACT COMPONENTS
 ↓
STATE
 ↓
DATA / API INTEGRATION
 ↓
LOADING / EMPTY / ERROR / SUCCESS STATES
 ↓
ACCESSIBILITY
 ↓
MOTION / POLISH
 ↓
SEO
 ↓
PERFORMANCE
 ↓
TESTING
 ↓
VISUAL QA
 ↓
DEPLOYMENT
 ↓
ITERATION
```

The frontend developer's job is not:

> "Make the page look good."

It is:

> **Turn product requirements into an accessible, responsive, interactive, maintainable, performant user interface.**

---

# 2. FRONTEND RESPONSIBILITY MAP

## 2.1 What frontend owns

```text
UI
UX implementation
Layout
Typography
Responsive behavior
Interaction
Browser behavior
Client-side state
Component architecture
Forms
Validation UX
Loading states
Error states
Empty states
Accessibility
Animation
SEO implementation
Performance
Visual quality
API consumption
Frontend testing
Deployment configuration
```

## 2.2 What frontend consumes

```text
APIs
Authentication state
User data
Content
Images
Files
Permissions
Server responses
Error responses
Configuration
Feature flags
```

## 2.3 What frontend does NOT treat as its security boundary

```text
Authorization
Database security
Server-side validation
Secret management
Database permissions
Server trust boundaries
```

The frontend can:

* hide/show UI
* redirect users
* disable controls
* display permissions
* handle authentication state

But the frontend must **never be trusted as the actual security boundary**.

---

# 3. TECHNOLOGY MAP

## Foundation

```text
HTML
CSS
JavaScript
Git
npm
Browser DevTools
```

## Modern frontend

```text
React
Component architecture
State management
Routing
Data fetching
Forms
Accessibility
Testing
Performance
```

## Full React ecosystem

```text
React
Next.js
TypeScript
CSS architecture
UI component systems
Testing tools
Data-fetching libraries
State-management libraries
```

## Rendering concepts

```text
Client-side rendering
Server-side rendering
Static generation
Incremental/static regeneration
Server Components
Client Components
Hydration
Streaming
```

Do not learn every technology simultaneously.

Choose the smallest stack capable of solving the project.

---

# 4. PROJECT INTAKE

Before writing code, answer:

```text
What am I building?

Who is it for?

What problem does it solve?

What is the primary user action?

What does success look like?

What is the MVP?

What is explicitly NOT part of the MVP?

What pages are required?

What interactions are required?

Does it need external data?

Does it need authentication?

Does it need SEO?

Does it need real-time behavior?

Does it need complex state?

Does it need React?

Does it need Next.js?
```

---

# 5. PRODUCT / UX DISCOVERY

Do not start with components.

Start with the user.

## Identify:

```text
Primary user
Secondary users
User goal
User pain
Primary task
Secondary tasks
Desired outcome
```

Then write:

```text
As a [user],
I want to [action],
so that [outcome].
```

---

# 6. MVP DEFINITION

Separate:

### Must have

Required for the product to function.

### Should have

Important but not essential.

### Could have

Useful enhancements.

### Not now

Explicitly postponed.

This prevents frontend projects from becoming infinite redesigns.

---

# 7. USER FLOW

Map the primary journey.

Example:

```text
LANDING PAGE
    ↓
SIGN UP
    ↓
DASHBOARD
    ↓
CREATE ITEM
    ↓
EDIT ITEM
    ↓
SAVE
    ↓
SUCCESS
```

For every important flow identify:

```text
Entry
Action
Feedback
Next action
Success
Failure
Exit
```

---

# 8. INFORMATION ARCHITECTURE

Before styling pages, decide:

```text
What information exists?

How is it grouped?

What belongs together?

What belongs on separate pages?

What is primary?

What is secondary?

What navigation is required?
```

Think:

```text
Product
 ├── Home
 ├── Explore
 ├── Dashboard
 ├── Settings
 └── Profile
```

---

# 9. PAGE / ROUTE INVENTORY

Create a route map.

Example:

```text
/
├── /about
├── /pricing
├── /login
├── /signup
├── /dashboard
├── /dashboard/projects
├── /dashboard/settings
└── /profile
```

For each route define:

```text
Purpose
Audience
Primary action
Required data
Loading state
Empty state
Error state
Success state
SEO requirements
Authentication requirements
```

---

# 10. CONTENT / UI MODEL

Frontend applications still need a model of the information they display.

Example:

```text
User
 ├── name
 ├── avatar
 ├── role
 └── status

Project
 ├── title
 ├── description
 ├── image
 ├── status
 └── updatedAt
```

This is a **UI/data-consumption model**, not a database schema.

---

# 11. DESIGN DIRECTION

Before implementation, establish the visual language.

Decide:

```text
Visual personality
Color direction
Typography
Density
Spacing
Shape language
Icon style
Image treatment
Border treatment
Shadow treatment
Motion personality
```

Ask:

> What should this interface feel like?

Examples:

```text
Minimal
Editorial
Playful
Technical
Luxury
Brutalist
Futuristic
Corporate
Experimental
Friendly
Dense
Calm
```

---

# 12. DESIGN SYSTEM FOUNDATION

Define reusable design tokens.

## Colors

```text
Primary
Secondary
Background
Surface
Text
Muted text
Border
Success
Warning
Error
Info
```

## Typography

```text
Font family
Font sizes
Font weights
Line heights
Letter spacing
Heading hierarchy
Body hierarchy
```

## Spacing

Create a consistent scale:

```text
xs
sm
md
lg
xl
2xl
3xl
```

## Shape

```text
Border radius
Border widths
Shadow levels
```

## Layout

```text
Container width
Page padding
Grid columns
Gap scale
Breakpoints
```

---

# 13. DESIGN TOKENS BEFORE RANDOM VALUES

Avoid:

```css
margin: 17px;
padding: 23px;
border-radius: 13px;
```

unless the design genuinely requires it.

Prefer a system.

```text
Spacing
Typography
Colors
Radii
Shadows
Z-index
Breakpoints
```

Consistency compounds.

---

# 14. UI ARCHITECTURE

Think hierarchically:

```text
Application
 ↓
Pages
 ↓
Sections
 ↓
Components
 ↓
Primitives
```

Example:

```text
Dashboard
 ├── Sidebar
 ├── Header
 ├── StatsGrid
 │    ├── StatCard
 │    ├── StatCard
 │    └── StatCard
 ├── ActivitySection
 │    ├── ActivityList
 │    └── ActivityItem
 └── EmptyState
```

---

# 15. COMPONENTIZATION RULE

Create a component when:

* it is reused
* it has a meaningful responsibility
* it has independent behavior
* it improves readability
* it represents a stable UI concept

Do NOT create components merely because:

> "This div is 10 lines long."

---

# 16. COMPONENT RESPONSIBILITY

A component should have a clear reason to exist.

Bad:

```text
MegaDashboardEverything.jsx
```

Better:

```text
Dashboard
StatsGrid
StatCard
ActivityFeed
ActivityItem
FilterBar
EmptyState
```

But avoid excessive fragmentation.

The goal is:

> **Clear boundaries, not maximum component count.**

---

# 17. FOLDER ARCHITECTURE

A practical React structure:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── features/
├── hooks/
├── lib/
├── services/
├── styles/
├── assets/
├── types/
└── utils/
```

For feature-heavy applications:

```text
src/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── profile/
│   └── projects/
├── components/
├── lib/
├── hooks/
└── styles/
```

Choose structure based on project complexity.

---

# 18. SEMANTIC HTML

Start with meaning.

Prefer:

```html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
<button>
<form>
<label>
```

over:

```html
<div>
<div>
<div>
<div>
```

Semantic HTML improves:

* accessibility
* maintainability
* SEO
* browser behavior
* developer understanding

---

# 19. HTML-FIRST IMPLEMENTATION

Before making the interface beautiful:

1. Build the document structure.
2. Make content understandable.
3. Make controls functional.
4. Verify semantics.
5. Then style.

HTML is the skeleton.

CSS is the visual system.

JavaScript is the behavior.

---

# 20. CSS MASTER WORKFLOW

Understand:

```text
Cascade
Specificity
Inheritance
Box model
Display
Positioning
Flexbox
Grid
Sizing
Overflow
Stacking contexts
Typography
Pseudo-elements
Pseudo-classes
Transitions
Animations
Media queries
Container queries
```

---

# 21. LAYOUT STRATEGY

Use:

### Flexbox

For:

```text
Rows
Columns
Alignment
Navigation
Toolbars
Cards
Controls
```

### Grid

For:

```text
Complex page layouts
Dashboards
Card grids
Editorial layouts
Two-dimensional structures
```

### Positioning

For:

```text
Overlays
Floating elements
Badges
Menus
Modals
Sticky interfaces
```

Do not use absolute positioning to compensate for a poorly designed layout.

---

# 22. CONTAINER STRATEGY

Establish a predictable content width.

Example:

```text
Viewport
 └── Page padding
      └── Max-width container
           └── Content
```

This prevents every page from inventing its own width system.

---

# 23. RESPONSIVE-FIRST WORKFLOW

Do not ask:

> "How do I make desktop smaller?"

Ask:

> "How should this interface behave at every viewport?"

Test:

```text
Mobile
Tablet
Laptop
Desktop
Large desktop
```

---

# 24. RESPONSIVE DESIGN QUESTIONS

For every component ask:

```text
Does width change?

Does height change?

Does layout direction change?

Does content wrap?

Does navigation collapse?

Does typography scale?

Do controls remain usable?

Does touch interaction work?

Does the hierarchy remain clear?
```

---

# 25. FLUID RESPONSIVE DESIGN

Prefer fluid systems where appropriate:

```text
clamp()
min()
max()
minmax()
flex
grid
percentage sizing
viewport units
container queries
```

Avoid designing only for two hardcoded widths.

---

# 26. MOBILE CHECK

On mobile verify:

```text
No horizontal overflow
Buttons are tappable
Text remains readable
Navigation works
Forms remain usable
Images scale correctly
Cards don't become cramped
Important content remains visible
```

---

# 27. JAVASCRIPT MENTAL MODEL

JavaScript controls behavior.

Think in terms of:

```text
Input
 ↓
Event
 ↓
State change
 ↓
DOM/UI update
 ↓
Feedback
```

Example:

```text
User clicks menu
 ↓
toggle state
 ↓
navigation opens
 ↓
button state changes
 ↓
focus moves appropriately
```

---

# 28. DOM / EVENT WORKFLOW

Understand:

```text
DOM selection
Event listeners
Event bubbling
Event delegation
Forms
Input events
Keyboard events
Mouse events
Pointer events
```

Always understand what the browser is doing before adding a library.

---

# 29. BROWSER APIs

Learn the platform.

Important APIs include:

```text
Fetch
LocalStorage
SessionStorage
URL
History
Clipboard
IntersectionObserver
ResizeObserver
Web Storage
Geolocation
Notifications
File APIs
Web APIs
```

Use browser capabilities directly when appropriate.

---

# 30. ASYNC FRONTEND LOGIC

Understand:

```text
Promises
async / await
fetch
try / catch
loading
success
failure
cancellation
timeouts
race conditions
```

Never build API-driven interfaces around the assumption that the network is instant.

---

# 31. API CONSUMPTION

Frontend does not need to own the backend to consume an API.

Model the interaction:

```text
UI
 ↓
Request
 ↓
Loading
 ↓
Response
 ↓
Success / Error
 ↓
UI update
```

Every API interaction should account for:

```text
Loading
Success
Empty
Error
Retry
Disabled state
Unexpected response
```

---

# 32. REACT DECISION

Use React when the interface benefits from:

```text
Reusable components
Complex interaction
Shared state
Dynamic views
Frequent UI updates
Large application surfaces
```

Do not add React simply because:

> "Professional developers use React."

Choose technology based on the problem.

---

# 33. REACT CORE MODEL

Understand:

```text
Components
Props
State
Events
Conditional rendering
Lists
Keys
Hooks
Effects
Refs
Context
Composition
```

Before learning advanced React, master these.

---

# 34. REACT COMPONENT FLOW

Think:

```text
Props
 ↓
Component
 ↓
Render
 ↓
User interaction
 ↓
State change
 ↓
Re-render
 ↓
Updated UI
```

Understand this deeply.

---

# 35. STATE MANAGEMENT

Ask:

> What actually needs to be state?

Prefer:

```text
Local state
```

when only one component needs it.

Use:

```text
Lifted state
```

when related components need shared data.

Use:

```text
Context
```

for genuinely shared concerns.

Use an external state library only when application complexity justifies it.

---

# 36. STATE DECISION TREE

```text
Does only one component need it?
        ↓
      LOCAL

Do sibling components need it?
        ↓
   LIFT STATE

Do many distant components need it?
        ↓
    CONTEXT / STORE

Is it server data?
        ↓
 SERVER-STATE / DATA-FETCHING SOLUTION
```

Do not put everything into global state.

---

# 37. DERIVED STATE

Before creating state ask:

> Can this value be calculated from existing state?

Prefer:

```text
existing state
      ↓
derived value
```

instead of:

```text
state A
state B
state C
```

when B and C can be calculated.

---

# 38. EFFECTS

Use effects for synchronization with external systems.

Examples:

```text
Browser APIs
Subscriptions
Timers
Network synchronization
Third-party libraries
```

Do not use effects simply because:

> "Something changed."

Avoid unnecessary effects.

---

# 39. DATA FETCHING / SERVER STATE

Treat remote data differently from local UI state.

Remote data often has:

```text
Freshness
Loading
Caching
Refetching
Errors
Retries
Pagination
Optimistic updates
Invalidation
```

Keep server-state concerns separate from purely visual state.

---

# 40. NEXT.JS FRONTEND CONCEPTS

When using Next.js, understand:

```text
Routing
Layouts
Navigation
Loading UI
Error UI
Dynamic routes
Metadata
Server rendering
Static generation
Server Components
Client Components
Streaming
Caching
```

The goal is not:

> "Use every Next.js feature."

The goal is:

> **Choose the appropriate rendering and routing strategy for the interface.**

---

# 41. SERVER VS CLIENT COMPONENT DECISION

In Next.js, ask:

```text
Does this component need browser APIs?
Does it need interactive state?
Does it need event handlers?
Does it need effects?
```

If yes, it may need to be a Client Component.

If not, keep it as simple as possible.

Do not make the entire application client-rendered without reason.

---

# 42. FORMS

Every form should define:

```text
Initial state
Input behavior
Validation
Error display
Submission
Loading state
Success state
Failure state
Reset behavior
Accessibility
```

---

# 43. FORM UX

Users should understand:

```text
What to enter
Why it is required
Whether input is valid
What went wrong
What happens after submission
```

Never make users hunt for validation errors.

---

# 44. UI STATE MATRIX

Every significant interactive component should consider:

```text
Default
Hover
Focus
Active
Disabled
Loading
Success
Error
Empty
Selected
Expanded
Collapsed
```

Not every component needs every state.

But every relevant state should be intentional.

---

# 45. LOADING STATES

Choose appropriately:

```text
Spinner
Skeleton
Progress indicator
Placeholder
Optimistic UI
Disabled controls
```

Avoid freezing the interface without explanation.

---

# 46. EMPTY STATES

An empty state should answer:

```text
What happened?
Why is it empty?
What can I do next?
```

Example:

```text
No projects yet.

Create your first project to get started.

[Create project]
```

---

# 47. ERROR STATES

A useful frontend error state should provide:

```text
What happened
What the user can do
Retry where appropriate
Relevant support/context
```

Avoid:

```text
Error 500
```

with no useful next action.

---

# 48. INTERACTION DESIGN

Every interactive element should communicate:

```text
What is clickable?
What is currently selected?
What happened?
What happens next?
```

Use:

```text
Hover
Focus
Pressed
Selected
Disabled
Loading
```

to communicate state.

---

# 49. ACCESSIBILITY

Accessibility is not a final checkbox.

Build it into the architecture.

Core areas:

```text
Semantic HTML
Keyboard navigation
Visible focus
Labels
Accessible names
Color contrast
Screen-reader behavior
Heading hierarchy
Form errors
Alternative text
Reduced motion
Touch targets
```

---

# 50. ARIA RULE

Use semantic HTML first.

Then:

```text
ARIA when necessary.
```

Do not add ARIA to compensate for incorrect HTML.

---

# 51. KEYBOARD ACCESSIBILITY

Verify:

```text
Tab
Shift + Tab
Enter
Space
Escape
Arrow keys where appropriate
```

Users should be able to complete important flows without a mouse.

---

# 52. FOCUS MANAGEMENT

Pay particular attention to:

```text
Modals
Dialogs
Menus
Dropdowns
Route changes
Forms
Dynamic content
```

Focus should not mysteriously disappear.

---

# 53. MOTION / ANIMATION

Animation should communicate:

```text
Change
Hierarchy
Feedback
Continuity
Spatial relationships
```

Good motion often answers:

> "What just happened?"

---

# 54. MOTION RULES

Prefer:

```text
Subtle transitions
Purposeful entrance/exit
Microinteractions
State transitions
```

Avoid:

```text
Animation everywhere
Slow transitions
Motion that blocks interaction
Decorative movement that harms readability
```

Respect:

```text
prefers-reduced-motion
```

---

# 55. SEO

For public-facing pages consider:

```text
Title
Meta description
Canonical URL
Heading hierarchy
Semantic HTML
Open Graph metadata
Social previews
Structured data where appropriate
Readable URLs
Image alt text
```

SEO begins with good document structure.

---

# 56. PERFORMANCE

Frontend performance is a product feature.

Think about:

```text
JavaScript size
CSS size
Images
Fonts
Network requests
Rendering
Hydration
Caching
Lazy loading
Code splitting
Third-party scripts
```

---

# 57. IMAGE PERFORMANCE

Optimize:

```text
Dimensions
Format
Compression
Responsive sizes
Lazy loading
Priority
Aspect ratio
```

Never ship massive images when a small image will do.

---

# 58. FONT PERFORMANCE

Consider:

```text
Font count
Font weights
Font formats
Loading behavior
Fallback fonts
Layout shift
```

Avoid loading ten font weights because they look cool in a design file.

---

# 59. JAVASCRIPT PERFORMANCE

Ask:

```text
Does this dependency need to exist?

Can this calculation be simplified?

Can this component render less?

Can this code load later?

Can this feature be lazy-loaded?
```

Optimize after understanding the actual bottleneck.

---

# 60. RENDERING PERFORMANCE

Look for:

```text
Unnecessary renders
Large component trees
Expensive calculations
Large lists
Unoptimized images
Heavy third-party components
Layout thrashing
```

Do not prematurely optimize everything.

---

# 61. BROWSER DEVTOOLS WORKFLOW

Master:

```text
Elements
Console
Network
Sources
Application
Performance
Lighthouse
Responsive mode
Accessibility inspection
```

When something breaks, inspect the browser before guessing.

---

# 62. FRONTEND DEBUGGING PROTOCOL

When a bug appears:

```text
1. Reproduce
2. Define expected behavior
3. Define actual behavior
4. Inspect DOM
5. Inspect state
6. Inspect network
7. Inspect console
8. Isolate the smallest failing area
9. Form a hypothesis
10. Make ONE meaningful change
11. Test
12. Verify regression
13. Clean up
```

Never randomly change five things at once.

---

# 63. FIVE-LAYER DEBUGGING MODEL

When something is wrong, ask which layer failed.

```text
LAYER 1 — DATA
Is the data correct?

LAYER 2 — STATE
Does the application hold the correct state?

LAYER 3 — LOGIC
Is the behavior correct?

LAYER 4 — STRUCTURE
Is the DOM/component tree correct?

LAYER 5 — PRESENTATION
Is CSS causing the problem?
```

This dramatically reduces debugging time.

---

# 64. VISUAL DEBUGGING

For visual bugs inspect:

```text
Box model
Width
Height
Margin
Padding
Display
Position
Overflow
Grid tracks
Flex properties
Font metrics
Line height
Z-index
Stacking context
```

Do not immediately rewrite the component.

---

# 65. NETWORK DEBUGGING

For API issues inspect:

```text
Request URL
Method
Headers
Payload
Status code
Response body
Timing
CORS
Authentication
```

Separate:

> "The frontend request is wrong"

from:

> "The server response is wrong."

---

# 66. VISUAL QA

Compare the implementation against the intended design.

Check:

```text
Spacing
Alignment
Typography
Colors
Borders
Shadows
Images
Icons
Component sizes
Responsive behavior
```

Do not consider:

> "It works."

the same as:

> "It is finished."

---

# 67. CROSS-BROWSER QA

At minimum consider:

```text
Chrome
Firefox
Safari
Edge
```

And test important flows on:

```text
Desktop
Mobile
Touch input
Keyboard input
```

Prioritize browsers relevant to the project's audience.

---

# 68. TESTING STRATEGY

Use the smallest useful level of testing.

## Unit

Test:

```text
Pure logic
Utilities
Transformations
```

## Component

Test:

```text
Component behavior
Interaction
Conditional UI
Forms
States
```

## Integration

Test:

```text
Multiple components working together
API integration
Important workflows
```

## End-to-end

Test:

```text
Critical user journeys
```

---

# 69. TEST USER BEHAVIOR

Prefer:

```text
User clicks
User types
User submits
User navigates
User sees
```

over tests that depend heavily on implementation details.

---

# 70. FRONTEND FEATURE DELIVERY LOOP

For every feature:

```text
Requirement
 ↓
User flow
 ↓
UI states
 ↓
Component design
 ↓
Implementation
 ↓
Interaction
 ↓
Data integration
 ↓
Accessibility
 ↓
Testing
 ↓
Visual QA
 ↓
Performance
 ↓
Refactor
 ↓
Done
```

---

# 71. VERTICAL-SLICE DEVELOPMENT

Do not build:

```text
All HTML
then all CSS
then all JavaScript
then all React
```

for a complex application.

Instead build:

```text
Feature
 ├── UI
 ├── interaction
 ├── state
 ├── data
 ├── loading
 ├── error
 ├── accessibility
 └── testing
```

Then move to the next feature.

---

# 72. GIT WORKFLOW

Use Git continuously.

Typical flow:

```text
Create feature
 ↓
Implement small change
 ↓
Test
 ↓
Review diff
 ↓
Commit
 ↓
Continue
```

Commit meaningful units.

Avoid:

```text
final-final-v7-really-final
```

---

# 73. COMMIT THINKING

A commit should communicate:

```text
What changed?
Why?
```

Examples:

```text
feat: add responsive dashboard layout
fix: preserve modal focus on close
refactor: extract reusable form field
perf: lazy load chart module
a11y: improve keyboard navigation
```

---

# 74. REFACTORING WORKFLOW

Refactor when:

```text
Duplication appears
Components become unclear
State becomes tangled
Naming becomes confusing
Files become difficult to navigate
Patterns repeat
```

Do not refactor merely to make code look clever.

---

# 75. SECURITY CONSIDERATIONS

Frontend security fundamentals:

```text
Never expose secrets
Never trust client-side authorization
Avoid unsafe HTML
Sanitize untrusted content where required
Review dependencies
Understand XSS
Understand CSRF implications where relevant
Protect sensitive tokens appropriately
Use secure transport
Understand Content Security Policy
```

Remember:

> The browser is a hostile environment from the perspective of secrets and trust.

---

# 76. ENVIRONMENT VARIABLES

Frontend environment variables are not automatically secret.

Anything bundled into browser-delivered JavaScript can potentially be discovered by users.

Therefore:

```text
Public configuration → okay
Secrets → server-side only
```

---

# 77. DEPENDENCY STRATEGY

Before installing a package ask:

```text
Do I actually need it?

Can the platform solve this?

Can I implement it safely in 20 lines?

Will this package become architectural debt?

Is it maintained?

Is it excessively large?

Does it introduce unnecessary complexity?
```

Do not install a library for every problem.

---

# 78. FRONTEND ARCHITECTURE DECISION TREE

```text
Is it mostly static?
    ↓
HTML + CSS

Does it need browser interaction?
    ↓
JavaScript

Does it have substantial component/state complexity?
    ↓
React

Does it need routing/rendering/content architecture at scale?
    ↓
Next.js

Does it need complex shared state?
    ↓
Evaluate state-management solution

Does it consume remote data?
    ↓
Add data-fetching architecture

Does it require advanced interaction?
    ↓
Evaluate specialized libraries only where justified
```

---

# 79. WHEN TO USE VANILLA JAVASCRIPT

Excellent for:

```text
Landing pages
Small interactive sites
Simple widgets
Browser experiments
Learning
Progressive enhancement
Small utilities
```

---

# 80. WHEN TO USE REACT

Useful when:

```text
UI complexity increases
Components repeat
State becomes interconnected
Many views share behavior
Interactions become sophisticated
```

---

# 81. WHEN TO USE NEXT.JS

Consider it when you need:

```text
Structured routing
Layouts
Server/client rendering choices
SEO-friendly public pages
Large React applications
Static generation
Server rendering
Advanced navigation
```

Do not use it merely because:

> "Next.js is modern."

---

# 82. UNIVERSAL FRONTEND BUILD WORKFLOW

This is the master execution sequence.

```text
1. Understand the product
2. Define users
3. Define primary goals
4. Define MVP
5. Define non-goals
6. Map user journeys
7. Define information architecture
8. Inventory pages/routes
9. Define UI/data model
10. Identify reusable patterns
11. Establish visual direction
12. Create design tokens
13. Choose architecture
14. Initialize project
15. Configure Git
16. Build semantic HTML structure
17. Establish global CSS
18. Build responsive layout
19. Componentize
20. Add JavaScript behavior
21. Add React where appropriate
22. Add state
23. Integrate APIs/data
24. Add forms
25. Add validation
26. Add loading states
27. Add empty states
28. Add error states
29. Add success states
30. Add accessibility
31. Add motion
32. Add SEO
33. Test
34. Debug
35. Visual QA
36. Cross-browser QA
37. Performance pass
38. Refactor
39. Production build
40. Deploy
41. Smoke test
42. Document
43. Iterate
```

---

# 83. BUILD ANY FRONTEND — QUESTION SEQUENCE

When you do not know where to start, answer these in order:

```text
1. Who uses this?

2. What are they trying to accomplish?

3. What is the primary flow?

4. What pages exist?

5. What information does each page display?

6. What components repeat?

7. What should the interface look like?

8. What happens when the user interacts?

9. What state changes?

10. What data comes from outside the frontend?

11. What happens while waiting?

12. What happens when nothing exists?

13. What happens when something fails?

14. How does this work on mobile?

15. Can everyone use it?

16. Is it fast?

17. Is it discoverable?

18. Is it tested?

19. Is it visually correct?

20. Can it be deployed confidently?
```

---

# 84. FEATURE CHECKLIST

For every feature:

```text
[ ] Requirement understood
[ ] User flow defined
[ ] UI structure defined
[ ] Component boundaries defined
[ ] Responsive behavior defined
[ ] State defined
[ ] API/data requirements defined
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Success state
[ ] Accessibility
[ ] Keyboard support
[ ] Mobile behavior
[ ] Tests
[ ] Visual QA
[ ] Performance considered
[ ] Edge cases handled
[ ] Refactored
[ ] Documented where necessary
```

---

# 85. DESIGN SYSTEM CHECKLIST

```text
[ ] Colors
[ ] Typography
[ ] Spacing
[ ] Containers
[ ] Breakpoints
[ ] Border radius
[ ] Shadows
[ ] Icons
[ ] Buttons
[ ] Inputs
[ ] Cards
[ ] Navigation
[ ] Modals
[ ] Dropdowns
[ ] Tooltips
[ ] Alerts
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Focus states
[ ] Disabled states
```

---

# 86. UI / UX CHECKLIST

```text
[ ] Clear hierarchy
[ ] Clear primary action
[ ] Predictable navigation
[ ] Consistent spacing
[ ] Consistent typography
[ ] Clear feedback
[ ] Good empty states
[ ] Good error states
[ ] Good loading states
[ ] Responsive behavior
[ ] Touch-friendly controls
[ ] Keyboard-friendly controls
[ ] No unnecessary friction
```

---

# 87. ACCESSIBILITY CHECKLIST

```text
[ ] Semantic HTML
[ ] Proper headings
[ ] Form labels
[ ] Accessible names
[ ] Keyboard navigation
[ ] Visible focus
[ ] Logical tab order
[ ] Contrast
[ ] Alt text
[ ] Reduced motion
[ ] Error announcements where needed
[ ] Modal focus handling
[ ] Accessible navigation
[ ] No keyboard traps
```

---

# 88. PERFORMANCE CHECKLIST

```text
[ ] Images optimized
[ ] Fonts optimized
[ ] JavaScript minimized
[ ] Unnecessary dependencies removed
[ ] Code splitting considered
[ ] Lazy loading where useful
[ ] Third-party scripts reviewed
[ ] Network requests reviewed
[ ] Rendering performance checked
[ ] Large lists considered
[ ] Layout shifts minimized
[ ] Production build tested
```

---

# 89. SEO CHECKLIST

For public pages:

```text
[ ] Title
[ ] Description
[ ] Correct headings
[ ] Semantic HTML
[ ] Canonical URL where needed
[ ] Open Graph
[ ] Social preview
[ ] Crawlable content
[ ] Meaningful URLs
[ ] Image alt text
[ ] Structured data where appropriate
```

---

# 90. PRODUCTION READINESS GATE

Before deployment:

```text
FUNCTIONALITY
[ ] Core flow works

RESPONSIVENESS
[ ] Mobile works
[ ] Tablet works
[ ] Desktop works

ACCESSIBILITY
[ ] Keyboard works
[ ] Focus works
[ ] Semantic structure is sound

PERFORMANCE
[ ] Images optimized
[ ] Bundle reviewed
[ ] Slow states handled

ERROR HANDLING
[ ] Network errors handled
[ ] Empty states handled
[ ] Invalid input handled

SEO
[ ] Metadata correct
[ ] Public pages structured correctly

QUALITY
[ ] Visual QA completed
[ ] Cross-browser QA completed
[ ] Tests pass

SECURITY
[ ] No secrets exposed
[ ] Unsafe HTML reviewed
[ ] Dependencies reviewed

DEPLOYMENT
[ ] Production build succeeds
[ ] Environment configuration correct
[ ] Production smoke test completed
```

---

# 91. DOCUMENTATION

Document what future-you will need.

At minimum:

```text
README
Setup instructions
Development commands
Architecture overview
Environment variables
Deployment instructions
Important decisions
Known limitations
```

Avoid documenting obvious code.

Document decisions.

---

# 92. PROJECT MATURITY LEVELS

## LEVEL 1 — STATIC

```text
HTML
CSS
Basic Git
Responsive design
```

## LEVEL 2 — INTERACTIVE

```text
JavaScript
DOM
Events
Forms
Browser APIs
```

## LEVEL 3 — API-DRIVEN

```text
Fetch
Async JavaScript
Loading
Errors
Dynamic rendering
```

## LEVEL 4 — COMPONENT APPLICATION

```text
React
Components
Props
State
Hooks
Routing
```

## LEVEL 5 — ADVANCED FRONTEND

```text
Complex state
Data fetching
Reusable systems
Testing
Accessibility
Performance
```

## LEVEL 6 — PRODUCTION FRONTEND

```text
Next.js
Rendering strategies
SEO
Performance
Design systems
CI/CD
Monitoring
Large-scale architecture
```

---

# 93. PROJECT PROGRESSION LADDER

Build progressively.

```text
1. Personal landing page
2. Multi-page website
3. Responsive portfolio
4. Interactive JavaScript application
5. API-driven application
6. React application
7. Dashboard
8. Complex CRUD frontend
9. E-commerce frontend
10. Real-time frontend
11. Next.js application
12. Production-grade frontend system
```

Each project should force you to learn something new.

---

# 94. LEARN WHILE BUILDING

Do not stop development every time you encounter something unfamiliar.

Use:

```text
Encounter problem
 ↓
Understand problem
 ↓
Research concept
 ↓
Implement smallest solution
 ↓
Test
 ↓
Continue
```

The project becomes the curriculum.

---

# 95. ANTI-TUTORIAL RULE

Avoid:

```text
Watch tutorial
Copy code
Change colors
Call it a project
```

Instead:

```text
Define problem
 ↓
Attempt solution
 ↓
Get stuck
 ↓
Research
 ↓
Understand
 ↓
Implement
 ↓
Debug
 ↓
Remember
```

The difficult parts are often where the learning happens.

---

# 96. WHEN YOU DON'T KNOW WHAT TO DO NEXT

Ask:

```text
What is the current user goal?

What is the current feature?

What is the smallest next visible result?

What is preventing that result?

What is the smallest implementation that removes the blocker?
```

Then do that.

---

# 97. "DO NOT CODE YET" CHECK

Before opening the editor, verify:

```text
[ ] I understand the product
[ ] I know the primary user
[ ] I know the main flow
[ ] I know the pages
[ ] I know the major components
[ ] I know the responsive strategy
[ ] I know the required data
[ ] I know the important states
[ ] I know the MVP
```

If not, continue planning.

---

# 98. DEFINITION OF DONE

A frontend feature is not done merely because:

```text
It renders.
```

Done means:

```text
It works
+
It is understandable
+
It is responsive
+
It handles states
+
It is accessible
+
It is tested
+
It is visually correct
+
It performs acceptably
+
It is maintainable
```

---

# 99. FRONTEND PROFESSIONAL HABITS

Build these habits:

```text
Read before coding
Think before installing dependencies
Use semantic HTML
Design responsive behavior early
Keep components understandable
Keep state minimal
Test user behavior
Use DevTools
Inspect network requests
Review your own UI
Refactor intentionally
Commit frequently
Keep dependencies under control
```

---

# 100. WHAT "PROFESSIONAL FRONTEND" MEANS

Professional frontend development is not:

```text
Knowing 50 libraries
Writing complicated CSS
Using the newest framework
Having enormous component trees
Using animation everywhere
```

It is:

```text
Good product understanding
+
Good UI architecture
+
Good HTML
+
Good CSS
+
Good JavaScript
+
Good component design
+
Good state management
+
Good accessibility
+
Good performance
+
Good testing
+
Good debugging
+
Good judgment
```

---

# 101. THE MASTER FRONTEND LIFECYCLE

```text
DISCOVER
 ↓
DEFINE
 ↓
MAP
 ↓
DESIGN
 ↓
ARCHITECT
 ↓
STRUCTURE
 ↓
STYLE
 ↓
INTERACT
 ↓
COMPONENTIZE
 ↓
STATE
 ↓
INTEGRATE
 ↓
ACCESSIBILITY
 ↓
MOTION
 ↓
SEO
 ↓
TEST
 ↓
DEBUG
 ↓
QA
 ↓
OPTIMIZE
 ↓
DEPLOY
 ↓
ITERATE
```

---

# 102. ONE-PAGE FRONTEND WORKFLOW

When you need the shortest possible version:

```text
1. Understand the product
2. Define the user
3. Define the primary flow
4. Define MVP
5. Map pages
6. Define information architecture
7. Establish visual direction
8. Create design tokens
9. Choose technology
10. Initialize project
11. Build semantic HTML
12. Build responsive CSS
13. Componentize
14. Add JavaScript behavior
15. Add React where justified
16. Add state
17. Integrate APIs
18. Add forms
19. Handle loading / empty / error / success
20. Add accessibility
21. Add motion
22. Add SEO
23. Test
24. Debug
25. Visual QA
26. Cross-browser QA
27. Performance pass
28. Refactor
29. Build production version
30. Deploy
31. Smoke test
32. Document
33. Iterate
```

---

# 103. FRONTEND MASTER CHECKLIST

## PRODUCT

```text
[ ] User identified
[ ] Problem identified
[ ] Primary goal identified
[ ] MVP defined
[ ] Non-goals defined
```

## UX

```text
[ ] User flows
[ ] Information architecture
[ ] Navigation
[ ] Page inventory
```

## DESIGN

```text
[ ] Visual direction
[ ] Typography
[ ] Colors
[ ] Spacing
[ ] Components
[ ] States
[ ] Responsive behavior
```

## DEVELOPMENT

```text
[ ] Semantic HTML
[ ] CSS architecture
[ ] Responsive layout
[ ] JavaScript
[ ] React architecture
[ ] State
[ ] API integration
[ ] Forms
```

## QUALITY

```text
[ ] Accessibility
[ ] SEO
[ ] Performance
[ ] Testing
[ ] Debugging
[ ] Visual QA
[ ] Cross-browser QA
```

## DELIVERY

```text
[ ] Git history clean
[ ] Production build
[ ] Deployment
[ ] Smoke test
[ ] Documentation
```

---

# 104. THE THREE QUESTIONS

At every stage, ask:

### 1. What does the user need?

```text
USER
```

### 2. What does the interface need?

```text
UI
```

### 3. What does the code need?

```text
IMPLEMENTATION
```

Never let implementation dictate the product unnecessarily.

---

# 105. THE FRONTEND GOLDEN RULE

> **Build from the user's goal outward, not from the framework inward.**

Do not begin with:

```text
Which library should I use?
```

Begin with:

```text
What does the user need to accomplish?
```

Then:

```text
What interface enables that?
```

Then:

```text
What architecture supports that interface?
```

Then:

```text
What technology implements that architecture?
```

---

# 106. THE ULTIMATE FRONTEND RULE

```text
PRODUCT
   ↓
USER
   ↓
FLOW
   ↓
UI
   ↓
STRUCTURE
   ↓
STYLE
   ↓
INTERACTION
   ↓
STATE
   ↓
DATA
   ↓
ACCESSIBILITY
   ↓
PERFORMANCE
   ↓
QUALITY
   ↓
DELIVERY
```

Never reverse the order unnecessarily.

Do not start by choosing libraries.

Do not start by creating random components.

Do not start by styling isolated screens.

Do not start by copying a tutorial.

Start with the problem.

Then build the interface.

Then make the interface work.

Then make it accessible.

Then make it fast.

Then make it beautiful.

Then make it production-ready.

---

# FINAL FRONTEND MANTRA

> **Think in products.**
>
> **Design in systems.**
>
> **Structure with HTML.**
>
> **Style with CSS.**
>
> **Behave with JavaScript.**
>
> **Compose with React.**
>
> **Render intelligently with Next.js when appropriate.**
>
> **Model state deliberately.**
>
> **Consume data defensively.**
>
> **Design for every device.**
>
> **Build for every user.**
>
> **Test what users actually do.**
>
> **Debug systematically.**
>
> **Optimize what matters.**
>
> **Ship deliberately.**
>
> **Iterate continuously.**

**The Sigma course is the foundation.
This workflow is the frontend operating system.**
