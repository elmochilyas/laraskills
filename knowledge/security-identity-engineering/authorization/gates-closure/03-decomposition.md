# Decomposition: gates closure

## Topic Overview

Gates are closures registered via `Gate::define()` that act as simple, named authorization checks. They receive the authenticated user as the first argument and optionally the relevant resource. Gates are best suited for non-model-specific actions: admin panel access, feature flags, subscription tier checks. They are the functional counterpart to Policy classes (which organize authorization per model). The ecosystem consensus is to use Gates sparingly — only for cross-cutting concerns — a...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
gates-closure/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### gates closure
- **Purpose:** Gates are closures registered via `Gate::define()` that act as simple, named authorization checks. They receive the authenticated user as the first argument and optionally the relevant resource. Gates are best suited for non-model-specific actions: admin panel access, feature flags, subscription tier checks. They are the functional counterpart to Policy classes (which organize authorization per model). The ecosystem consensus is to use Gates sparingly — only for cross-cutting concerns — a...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Auth guards/providers architecture, Middleware pipeline, Related: Policies (model-centric authorization), Super-admin bypass via Gate::before(), Blade @can/@cannot/@canany directives, Advanced Follow-up: Gate response objects with custom messages, Gate event listeners for audit logging, and Gate testing patterns

## Dependency Graph
**Depends on:** Prerequisites: Auth guards/providers architecture, Middleware pipeline, Related: Policies (model-centric authorization), Super-admin bypass via Gate::before(), Blade @can/@cannot/@canany directives, Advanced Follow-up: Gate response objects with custom messages, Gate event listeners for audit logging, and Gate testing patterns
**Depended on by:** Knowledge units that leverage or extend gates closure patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for gates closure.
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