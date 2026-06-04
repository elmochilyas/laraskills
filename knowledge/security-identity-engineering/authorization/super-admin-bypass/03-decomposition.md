# Decomposition: super admin bypass

## Topic Overview

The `Gate::before()` method registers a closure that runs before all Gate and Policy checks. By returning `true`, it grants access regardless of the specific authorization logic. This is the canonical pattern for implementing super-admin bypass — a user with the super-admin role automatically passes all authorization checks. The critical behavior: returning `true` skips the actual policy/gate check entirely; returning `false` denies access even if the specific check would allow it; returnin...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
super-admin-bypass/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### super admin bypass
- **Purpose:** The `Gate::before()` method registers a closure that runs before all Gate and Policy checks. By returning `true`, it grants access regardless of the specific authorization logic. This is the canonical pattern for implementing super-admin bypass — a user with the super-admin role automatically passes all authorization checks. The critical behavior: returning `true` skips the actual policy/gate check entirely; returning `false` denies access even if the specific check would allow it; returnin...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Related: Spatie Permission (super-admin via hasRole), Blade authorization directives, Advanced Follow-up: Gate::after() for audit logging, Impersonation-aware authorization, and Partial super-admin bypass with role-specific restrictions

## Dependency Graph
**Depends on:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Related: Spatie Permission (super-admin via hasRole), Blade authorization directives, Advanced Follow-up: Gate::after() for audit logging, Impersonation-aware authorization, and Partial super-admin bypass with role-specific restrictions
**Depended on by:** Knowledge units that leverage or extend super admin bypass patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for super admin bypass.
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