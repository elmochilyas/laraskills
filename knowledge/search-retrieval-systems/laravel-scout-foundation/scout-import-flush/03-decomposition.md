# Decomposition: scout import flush

## Topic Overview

`scout:import` and `scout:flush` are Artisan commands for bulk synchronizing models with search indexes. `scout:import` iterates over all records of a model and pushes them to the search engine. `scout:flush` removes all records of a model from the index. They are the primary tools for initial index population, full re-indexes after schema changes, and index cleanup.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
scout-import-flush/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### scout import flush
- **Purpose:** `scout:import` and `scout:flush` are Artisan commands for bulk synchronizing models with search indexes. `scout:import` iterates over all records of a model and pushes them to the search engine. `scout:flush` removes all records of a model from the index. They are the primary tools for initial index population, full re-indexes after schema changes, and index cleanup.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K010 (makeAllSearchableUsing), and K008 (withoutSyncingToSearch)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K010 (makeAllSearchableUsing), and K008 (withoutSyncingToSearch)
**Depended on by:** Knowledge units that leverage or extend scout import flush patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for scout import flush.
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