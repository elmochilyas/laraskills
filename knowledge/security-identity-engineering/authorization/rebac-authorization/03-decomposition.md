# Decomposition: rebac authorization

## Topic Overview

Relationship-Based Access Control (ReBAC) authorizes actions based on the relationships between users and resources, rather than static attributes or roles. Inspired by Google Zanzibar, ReBAC models authorization as a graph: users are nodes, resources are nodes, and edges represent relationships (owner, editor, viewer). A user can perform an action if a path exists in the graph connecting them to the resource with the required relationship. ReBAC is the most expressive authorization model but...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
rebac-authorization/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### rebac authorization
- **Purpose:** Relationship-Based Access Control (ReBAC) authorizes actions based on the relationships between users and resources, rather than static attributes or roles. Inspired by Google Zanzibar, ReBAC models authorization as a graph: users are nodes, resources are nodes, and edges represent relationships (owner, editor, viewer). A user can perform an action if a path exists in the graph connecting them to the resource with the required relationship. ReBAC is the most expressive authorization model but...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: RBAC design, ABAC attribute-based authorization, Related: Policies (model authorization), Spatie Permission (team-scoped permissions), Advanced Follow-up: Zanzibar protocol implementation, ReBAC with Neo4j in Laravel, and Permit.io FGA integration

## Dependency Graph
**Depends on:** Prerequisites: RBAC design, ABAC attribute-based authorization, Related: Policies (model authorization), Spatie Permission (team-scoped permissions), Advanced Follow-up: Zanzibar protocol implementation, ReBAC with Neo4j in Laravel, and Permit.io FGA integration
**Depended on by:** Knowledge units that leverage or extend rebac authorization patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for rebac authorization.
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