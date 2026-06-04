# Decomposition: Cross-module data access: query patterns without JOINs

## Topic Overview

In a modular monolith, cross-module data access via SQL JOINs is forbidden. Module A cannot directly query Module B's database tables.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-10-cross-module-data-access/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Cross-module data access: query patterns without JOINs
- **Purpose:** In a modular monolith, cross-module data access via SQL JOINs is forbidden. Module A cannot directly query Module B's database tables.
- **Difficulty:** Advanced
- **Dependencies:** MMD-06 Sync inter-module comm

## Dependency Graph

This KU depends on: MMD-06 Sync inter-module comm
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Forbidden pattern:** `Order::join('inventory_products', ...)` — Order module querying the Inventory module's tables. **Allowed patterns:** - Service call: `$this->inventory->checkStock($productIds...
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