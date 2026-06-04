# Decomposition: without syncing to search

## Topic Overview

`withoutSyncingToSearch()` temporarily disables Scout's auto-sync for a closure scope. Any Eloquent operations performed inside the closure will not trigger index updates. This is essential for bulk imports, batch updates, data migrations, and seeding — preventing N individual HTTP calls to the search engine when a single batch sync suffices.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
without-syncing-to-search/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### without syncing to search
- **Purpose:** `withoutSyncingToSearch()` temporarily disables Scout's auto-sync for a closure scope. Any Eloquent operations performed inside the closure will not trigger index updates. This is essential for bulk imports, batch updates, data migrations, and seeding — preventing N individual HTTP calls to the search engine when a single batch sync suffices.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K009 (scout:import / flush), and K010 (makeAllSearchableUsing)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K009 (scout:import / flush), and K010 (makeAllSearchableUsing)
**Depended on by:** Knowledge units that leverage or extend without syncing to search patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for without syncing to search.
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