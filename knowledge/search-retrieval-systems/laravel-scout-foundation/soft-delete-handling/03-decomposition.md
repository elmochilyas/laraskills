# Decomposition: soft delete handling

## Topic Overview

Scout automatically handles soft-deleted models by adding a `__soft_deleted` attribute to the searchable array when a model is trashed. When querying, soft-deleted records are excluded from results by default. The `withTrashed()` method on the search query can include them. This is transparent to the developer once the `SoftDeletes` trait is present.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
soft-delete-handling/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### soft delete handling
- **Purpose:** Scout automatically handles soft-deleted models by adding a `__soft_deleted` attribute to the searchable array when a model is trashed. When querying, soft-deleted records are excluded from results by default. The `withTrashed()` method on the search query can include them. This is transparent to the developer once the `SoftDeletes` trait is present.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), and K007 (shouldBeSearchable)

## Dependency Graph
**Depends on:** K001 (Searchable trait), and K007 (shouldBeSearchable)
**Depended on by:** Knowledge units that leverage or extend soft delete handling patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for soft delete handling.
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