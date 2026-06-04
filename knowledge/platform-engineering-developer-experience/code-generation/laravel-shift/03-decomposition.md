# Decomposition: laravel shift

## Topic Overview

Laravel Shift is a commercial automated upgrade service that analyzes Laravel applications and applies version-to-version upgrade changes. Shifts handle: composer dependency updates (Laravel version bump, third-party package compatibility), configuration file migrations (config/ changes between versions), code transformations (deprecated method replacements, API changes), facade-to-helper conversions, and structural changes (directory layout, service provider registration). Each Shift is a PH...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
laravel-shift/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### laravel shift
- **Purpose:** Laravel Shift is a commercial automated upgrade service that analyzes Laravel applications and applies version-to-version upgrade changes. Shifts handle: composer dependency updates (Laravel version bump, third-party package compatibility), configuration file migrations (config/ changes between versions), code transformations (deprecated method replacements, API changes), facade-to-helper conversions, and structural changes (directory layout, service provider registration). Each Shift is a PH...
- **Difficulty:** Foundation
- **Dependencies:** blueprint-code-generation, rector-rules-laravel-upgrades, and stub-customization-laravel

## Dependency Graph
**Depends on:** blueprint-code-generation, rector-rules-laravel-upgrades, and stub-customization-laravel
**Depended on by:** Knowledge units that leverage or extend laravel shift patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for laravel shift.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization