# Decomposition: rector rules laravel upgrades

## Topic Overview

Rector provides a set of Laravel-specific rules (via `rectorphp/rector-laravel`) that automate code transformations for Laravel version upgrades and best practice adoption. These rules cover: deprecated method replacements (e.g., `env()` helper to config in production code), renamed classes and interfaces (e.g., `Mailable::from()` signature changes), facade-to-helper conversions, route definition changes, middleware registration changes, and migration-related transformations. The rule sets ar...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
rector-rules-laravel-upgrades/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### rector rules laravel upgrades
- **Purpose:** Rector provides a set of Laravel-specific rules (via `rectorphp/rector-laravel`) that automate code transformations for Laravel version upgrades and best practice adoption. These rules cover: deprecated method replacements (e.g., `env()` helper to config in production code), renamed classes and interfaces (e.g., `Mailable::from()` signature changes), facade-to-helper conversions, route definition changes, middleware registration changes, and migration-related transformations. The rule sets ar...
- **Difficulty:** Foundation
- **Dependencies:** laravel-rector, laravel-shift, and phpstan-baseline-patterns

## Dependency Graph
**Depends on:** laravel-rector, laravel-shift, and phpstan-baseline-patterns
**Depended on by:** Knowledge units that leverage or extend rector rules laravel upgrades patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for rector rules laravel upgrades.
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