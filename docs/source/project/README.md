# PackagePulse --- Project Documentation Pack

This pack defines the product, technical architecture, application
flows, visual system, and gated implementation plan for
**PackagePulse**, a developer-first npm package explorer.

## Included documents

1.  `01-PRD.md` --- product requirements, page inventory, component
    inventory, acceptance criteria, scope.
2.  `02-TRD.md` --- technical architecture, API contracts, data types,
    resilience, testing and security.
3.  `03-APP-FLOW.md` --- information architecture, route map, user
    journeys and state transitions.
4.  `04-DESIGN-BRIEF.md` --- visual direction, tokens, responsive rules,
    interaction and anti-slop guardrails.
5.  `05-IMPLEMENTATION-PLAN.md` --- vertical-slice phases, deliverables,
    stage gates and release criteria.
6.  `06-MASTER-AGENT-PROMPT.md` --- copy-ready operating prompt for the
    AI coding agent.

## Required source-of-truth files

Use these documents alongside the supplied files: -
`MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW(4).md` --- governing frontend
workflow. - `design(1).md` --- supplied ECC-style design-system
reference, adapted in the design brief. - `SKILL(1).md` --- Cloudflare
security-audit-skill instructions for a later, full audit of the
implemented codebase.

## Project rule

**Do not advance to the next implementation phase until the current
phase is fully implemented, designed, connected to realistic sample/live
data as applicable, tested, visually checked, and its exit gate
passes.** A phase report is not evidence by itself: inspect the actual
code and test output.

The public npm Registry API is the intended live data source. Do not
invent data, download counts, security ratings, or maintenance
guarantees. Where a field is missing, display "Not provided" or an
equivalent neutral state rather than treating it as zero.

## Design reference note

The supplied ECC design file is a visual reference, not a brand to copy.
Reinterpret its dark midnight canvas, warm coral/peach accent, Exo 2
typography, restrained 10px geometry, border-led surfaces, compact
technical details and practical tone into a distinct PackagePulse
identity. Do not copy logos, product-specific wording, screenshots, or
proprietary branding.

## Audit timing

A full security audit is a post-implementation activity. The skill
requires a concrete repository target and a safe, isolated execution
environment. Do not claim the audit passed before the code exists and
the audit workflow has actually run. If required sandbox controls are
unavailable, record the audit as incomplete/needs-validation and state
why.
