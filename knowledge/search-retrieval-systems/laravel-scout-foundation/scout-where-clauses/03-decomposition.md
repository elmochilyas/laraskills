# Decomposition: scout where clauses

## Topic Overview

Scout's `where()`, `whereIn()`, and `whereNotIn()` methods enable filtered search queries that combine full-text search with structured attribute filtering. These are applied alongside the text query to narrow results based on indexed fields. They operate on the search engine side (not database side), filtering before results are returned.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
scout-where-clauses/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### scout where clauses
- **Purpose:** Scout's `where()`, `whereIn()`, and `whereNotIn()` methods enable filtered search queries that combine full-text search with structured attribute filtering. These are applied alongside the text query to narrow results based on indexed fields. They operate on the search engine side (not database side), filtering before results are returned.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K012 (Scout paginate), and K024 (Meilisearch filterable/sortable)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K012 (Scout paginate), and K024 (Meilisearch filterable/sortable)
**Depended on by:** Knowledge units that leverage or extend scout where clauses patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for scout where clauses.
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