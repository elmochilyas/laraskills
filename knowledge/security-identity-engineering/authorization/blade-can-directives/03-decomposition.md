# Decomposition: blade can directives

## Topic Overview

Blade directives `@can`, `@cannot`, and `@canany` provide UI-level authorization checks in templates. They work with both Gates (`@can('view-admin')`) and Policies (`@can('update', $post)`). These directives are PRESENTATION-ONLY — they hide or show UI elements but do NOT protect routes. Server-side enforcement via `Gate::authorize()`, middleware, or `authorizeResource()` is mandatory. A common production mistake is relying solely on Blade directives for security, leaving endpoints unprotec...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
blade-can-directives/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### blade can directives
- **Purpose:** Blade directives `@can`, `@cannot`, and `@canany` provide UI-level authorization checks in templates. They work with both Gates (`@can('view-admin')`) and Policies (`@can('update', $post)`). These directives are PRESENTATION-ONLY — they hide or show UI elements but do NOT protect routes. Server-side enforcement via `Gate::authorize()`, middleware, or `authorizeResource()` is mandatory. A common production mistake is relying solely on Blade directives for security, leaving endpoints unprotec...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Related: Spatie Permission Blade directives, Server-side authorization enforcement patterns, Advanced Follow-up: Pre-computing authorization for Blade views, and Testing Blade directive behavior

## Dependency Graph
**Depends on:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Related: Spatie Permission Blade directives, Server-side authorization enforcement patterns, Advanced Follow-up: Pre-computing authorization for Blade views, and Testing Blade directive behavior
**Depended on by:** Knowledge units that leverage or extend blade can directives patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for blade can directives.
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