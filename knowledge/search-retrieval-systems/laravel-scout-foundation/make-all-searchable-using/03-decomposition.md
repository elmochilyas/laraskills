# Decomposition: make all searchable using

## Topic Overview

`makeAllSearchableUsing()` and `makeSearchableUsing()` modify the Eloquent query used when bulk-indexing models via `scout:import` or `searchable()`. They are the primary mechanism for ensuring relationships are eagerly loaded during batch indexing, preventing N+1 queries per chunk.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
make-all-searchable-using/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### make all searchable using
- **Purpose:** `makeAllSearchableUsing()` and `makeSearchableUsing()` modify the Eloquent query used when bulk-indexing models via `scout:import` or `searchable()`. They are the primary mechanism for ensuring relationships are eagerly loaded during batch indexing, preventing N+1 queries per chunk.
- **Difficulty:** Foundation
- **Dependencies:** K005 (toSearchableArray), and K009 (scout:import / flush)

## Dependency Graph
**Depends on:** K005 (toSearchableArray), and K009 (scout:import / flush)
**Depended on by:** Knowledge units that leverage or extend make all searchable using patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for make all searchable using.
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