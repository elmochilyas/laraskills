# Decomposition: spatie permission

## Topic Overview

Spatie `laravel-permission` is the de facto standard package for database-driven role and permission management in Laravel. It provides `HasRoles` trait for the User model, pivot tables for role/permission assignments, middleware for route-level enforcement, and Blade directives. The package caches permissions per request (default 24-hour TTL), auto-refreshes on mutations through built-in functions, and supports team-scoped permissions, wildcard permissions, and multiple guard configurations....

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
spatie-permission/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### spatie permission
- **Purpose:** Spatie `laravel-permission` is the de facto standard package for database-driven role and permission management in Laravel. It provides `HasRoles` trait for the User model, pivot tables for role/permission assignments, middleware for route-level enforcement, and Blade directives. The package caches permissions per request (default 24-hour TTL), auto-refreshes on mutations through built-in functions, and supports team-scoped permissions, wildcard permissions, and multiple guard configurations....
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Related: RBAC design (hierarchical, constrained), Super-admin bypass, Blade authorization directives, Advanced Follow-up: Spatie Permission with team scoping, Wildcard permissions advanced patterns, and Large-scale permission performance tuning

## Dependency Graph
**Depends on:** Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Related: RBAC design (hierarchical, constrained), Super-admin bypass, Blade authorization directives, Advanced Follow-up: Spatie Permission with team scoping, Wildcard permissions advanced patterns, and Large-scale permission performance tuning
**Depended on by:** Knowledge units that leverage or extend spatie permission patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for spatie permission.
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