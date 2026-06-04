# Decomposition: should be searchable

## Topic Overview

`shouldBeSearchable()` is a boolean method on Searchable models that gates whether a model instance gets indexed. It acts as a pre-condition filter for the observer-based auto-sync. When it returns `false`, Scout skips indexing on save and removes the record from the index if it was previously indexed. This is primarily used for publish/draft workflows, soft-launch gating, and content lifecycle management.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
should-be-searchable/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### should be searchable
- **Purpose:** `shouldBeSearchable()` is a boolean method on Searchable models that gates whether a model instance gets indexed. It acts as a pre-condition filter for the observer-based auto-sync. When it returns `false`, Scout skips indexing on save and removes the record from the index if it was previously indexed. This is primarily used for publish/draft workflows, soft-launch gating, and content lifecycle management.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K005 (toSearchableArray), and K008 (withoutSyncingToSearch)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K005 (toSearchableArray), and K008 (withoutSyncingToSearch)
**Depended on by:** Knowledge units that leverage or extend should be searchable patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for should be searchable.
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