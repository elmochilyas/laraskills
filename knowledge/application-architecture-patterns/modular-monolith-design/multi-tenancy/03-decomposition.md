# Decomposition: Multi-tenancy considerations in modular monolith

## Topic Overview

Multi-tenancy in a modular monolith combines two concerns: tenant isolation (keeping Tenant A's data separate from Tenant B's) and module isolation (keeping Module A's concerns separate from Module B's). The primary challenge is that different modules may require different tenancy strategies—some modules need strict database-per-tenant isolation, while others can share tables with tenant ID columns.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-14-multi-tenancy/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Multi-tenancy considerations in modular monolith
- **Purpose:** Multi-tenancy in a modular monolith combines two concerns: tenant isolation (keeping Tenant A's data separate from Tenant B's) and module isolation (keeping Module A's concerns separate from Module B's). The primary challenge is that different modules may require different tenancy strategies—some modules need strict database-per-tenant isolation, while others can share tables with tenant ID columns.
- **Difficulty:** Expert
- **Dependencies:** MMD-13 Database schema ownership

## Dependency Graph

This KU depends on: MMD-13 Database schema ownership
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Tenant isolation strategies:** - **Database-per-tenant:** Each tenant gets a separate database. Strongest isolation. Complex to manage (migrations across N databases). - **Schema-per-tenant:** Each ...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization