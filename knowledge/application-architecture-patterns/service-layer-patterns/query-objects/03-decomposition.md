# Decomposition: Query objects as alternative to repositories

## Topic Overview

Query objects are dedicated classes that encapsulate a specific database query or group of related queries. Unlike repositories (which group all data access for an entity), query objects focus on querying—not creating, updating, or deleting.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-16-query-objects/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Query objects as alternative to repositories
- **Purpose:** Query objects are dedicated classes that encapsulate a specific database query or group of related queries. Unlike repositories (which group all data access for an entity), query objects focus on querying—not creating, updating, or deleting.
- **Difficulty:** Intermediate
- **Dependencies:** SLP-14 Repository debate

## Dependency Graph

This KU depends on: SLP-14 Repository debate
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** ```php class OverdueInvoicesQuery {     public function __construct(
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