# Decomposition: searchable as index naming

## Topic Overview

`searchableAs()` determines the name of the search index where a model's records are stored. By default, Scout uses the model's table name (pluralized). Overriding this method enables multi-environment index separation, multi-tenancy, versioned indexes for deployment rollback, and cross-model indexing strategies.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
searchable-as-index-naming/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### searchable as index naming
- **Purpose:** `searchableAs()` determines the name of the search index where a model's records are stored. By default, Scout uses the model's table name (pluralized). Overriding this method enables multi-environment index separation, multi-tenancy, versioned indexes for deployment rollback, and cross-model indexing strategies.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), and K034 (Typesense collection schemas)

## Dependency Graph
**Depends on:** K001 (Searchable trait), and K034 (Typesense collection schemas)
**Depended on by:** Knowledge units that leverage or extend searchable as index naming patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for searchable as index naming.
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