# Decomposition: to searchable array

## Topic Overview

`toSearchableArray()` is the method on a Searchable model that defines the data payload sent to the search engine. By default, Scout sends the model's `toArray()` output (all visible attributes). Overriding this method is the primary mechanism for controlling index size, denormalizing related data, transforming values (timestamps to integers, HTML to plain text), and excluding sensitive fields.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
to-searchable-array/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### to searchable array
- **Purpose:** `toSearchableArray()` is the method on a Searchable model that defines the data payload sent to the search engine. By default, Scout sends the model's `toArray()` output (all visible attributes). Overriding this method is the primary mechanism for controlling index size, denormalizing related data, transforming values (timestamps to integers, HTML to plain text), and excluding sensitive fields.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K010 (makeAllSearchableUsing), and K034 (Typesense collection schemas)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K010 (makeAllSearchableUsing), and K034 (Typesense collection schemas)
**Depended on by:** Knowledge units that leverage or extend to searchable array patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for to searchable array.
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