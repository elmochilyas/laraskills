# Decomposition: rbac design

## Topic Overview

Role-Based Access Control (RBAC) in Laravel is typically implemented via Spatie `laravel-permission`, but the design patterns extend beyond package configuration. Hierarchical RBAC allows roles to inherit permissions from parent roles (e.g., `Editor` inherits `Viewer` permissions plus edit permissions). Constrained RBAC enforces separation-of-duty constraints (e.g., same user cannot be both `Purchaser` and `Approver`). The fundamental principle: permissions are atomic, roles group permissions...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
rbac-design/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### rbac design
- **Purpose:** Role-Based Access Control (RBAC) in Laravel is typically implemented via Spatie `laravel-permission`, but the design patterns extend beyond package configuration. Hierarchical RBAC allows roles to inherit permissions from parent roles (e.g., `Editor` inherits `Viewer` permissions plus edit permissions). Constrained RBAC enforces separation-of-duty constraints (e.g., same user cannot be both `Purchaser` and `Approver`). The fundamental principle: permissions are atomic, roles group permissions...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Spatie laravel-permission (roles, permissions), Gates/Policies, Related: ABAC attribute-based authorization, ReBAC relationship-based authorization, Advanced Follow-up: RBAC hierarchy with wildcard permissions, SoD constraint implementation patterns, and Migration from flat to hierarchical RBAC

## Dependency Graph
**Depends on:** Prerequisites: Spatie laravel-permission (roles, permissions), Gates/Policies, Related: ABAC attribute-based authorization, ReBAC relationship-based authorization, Advanced Follow-up: RBAC hierarchy with wildcard permissions, SoD constraint implementation patterns, and Migration from flat to hierarchical RBAC
**Depended on by:** Knowledge units that leverage or extend rbac design patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for rbac design.
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