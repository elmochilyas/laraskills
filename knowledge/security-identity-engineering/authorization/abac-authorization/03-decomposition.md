# Decomposition: abac authorization

## Topic Overview

Attribute-Based Access Control (ABAC) evaluates authorization decisions based on attributes of the user (department, clearance), resource (classification, owner), action (read, write), and environment (time, location, device). Unlike RBAC's binary "user has role → role has permission" model, ABAC evaluates boolean expressions combining multiple attributes: `user.department == resource.department AND user.clearance >= resource.classification AND time.business_hours`. ABAC is not natively sup...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
abac-authorization/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### abac authorization
- **Purpose:** Attribute-Based Access Control (ABAC) evaluates authorization decisions based on attributes of the user (department, clearance), resource (classification, owner), action (read, write), and environment (time, location, device). Unlike RBAC's binary "user has role → role has permission" model, ABAC evaluates boolean expressions combining multiple attributes: `user.department == resource.department AND user.clearance >= resource.classification AND time.business_hours`. ABAC is not natively sup...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: RBAC design, Gates/Policies, Spatie Permission, Related: ReBAC (relationship-based authorization), Policy Decision Point architecture, Advanced Follow-up: Permit.io Laravel integration, Custom PDP implementation with boolean expression engine, and Attribute-based policy testing strategies

## Dependency Graph
**Depends on:** Prerequisites: RBAC design, Gates/Policies, Spatie Permission, Related: ReBAC (relationship-based authorization), Policy Decision Point architecture, Advanced Follow-up: Permit.io Laravel integration, Custom PDP implementation with boolean expression engine, and Attribute-based policy testing strategies
**Depended on by:** Knowledge units that leverage or extend abac authorization patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for abac authorization.
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