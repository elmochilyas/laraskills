# Decomposition: full reindex vs incremental

## Topic Overview

Full re-index (scout:import) rebuilds the entire search index from the database. Incremental indexing syncs individual model changes as they happen. Each serves different purposes: full re-index for initialization and recovery, incremental for day-to-day operation.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


full-reindex-vs-incremental/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### full reindex vs incremental
- **Purpose:** Full re-index (scout:import) rebuilds the entire search index from the database. Incremental indexing syncs individual model changes as they happen. Each serves different purposes: full re-index for initialization and recovery, incremental for day-to-day operation.
- **Difficulty:** Foundation
- **Dependencies:** K009, K010, K004

## Dependency Graph
**Depends on:** K009, K010, K004
**Depended on by:** Knowledge units that leverage or extend full reindex vs incremental patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for full reindex vs incremental.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

? No Knowledge Unit is overloaded

? No major concept is missing

? Boundaries are clear

? Future phases can operate on individual units

? The structure can scale without reorganization
