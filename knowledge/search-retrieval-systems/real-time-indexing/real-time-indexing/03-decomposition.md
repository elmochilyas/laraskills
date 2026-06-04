# Decomposition: real time indexing

## Topic Overview

Real-time indexing is Scout's default behavior: every Eloquent model save, update, or delete automatically triggers a search index sync via model observers. This provides near-instant consistency between the database and search index, eliminating the need for scheduled batch syncs for active records.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
real-time-indexing/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### real time indexing
- **Purpose:** Real-time indexing is Scout's default behavior: every Eloquent model save, update, or delete automatically triggers a search index sync via model observers. This provides near-instant consistency between the database and search index, eliminating the need for scheduled batch syncs for active records.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K004 (Scout queue integration), and K007 (shouldBeSearchable)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K004 (Scout queue integration), and K007 (shouldBeSearchable)
**Depended on by:** Knowledge units that leverage or extend real time indexing patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for real time indexing.
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