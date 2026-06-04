# Decomposition: Cross-context queries without database JOINs

## Topic Overview

Cross-context queries that join tables from different bounded contexts are forbidden. The patterns that replace JOINs are: application-level aggregation (call service A, call service B, combine), event-synchronized local projections (maintain a local copy of cross-context data), and CQRS read models (a third model that combines data from multiple contexts).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-07-cross-context-queries/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Cross-context queries without database JOINs
- **Purpose:** Cross-context queries that join tables from different bounded contexts are forbidden. The patterns that replace JOINs are: application-level aggregation (call service A, call service B, combine), event-synchronized local projections (maintain a local copy of cross-context data), and CQRS read models (a third model that combines data from multiple contexts).
- **Difficulty:** Advanced
- **Dependencies:** DBC-05 Model ownership

## Dependency Graph

This KU depends on: DBC-05 Model ownership
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Forbidden:** `SELECT * FROM billing_invoices JOIN catalog_products ON ...` **Allowed:** Service call to Billing → service call to Catalog → combine in application code. ---
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