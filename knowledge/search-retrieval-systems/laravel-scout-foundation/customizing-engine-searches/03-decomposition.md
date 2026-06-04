# Decomposition: customizing engine searches

## Topic Overview

Scout's closure-based callback API allows passing engine-specific search parameters that the abstraction layer cannot express generically. When calling `Model::search()`, the second argument accepts a closure that receives the engine's search client, enabling direct manipulation of engine-specific features like typo tolerance thresholds, ranking rules, and custom parameters that don't have Scout-level equivalents.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
customizing-engine-searches/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### customizing engine searches
- **Purpose:** Scout's closure-based callback API allows passing engine-specific search parameters that the abstraction layer cannot express generically. When calling `Model::search()`, the second argument accepts a closure that receives the engine's search client, enabling direct manipulation of engine-specific features like typo tolerance thresholds, ranking rules, and custom parameters that don't have Scout-level equivalents.
- **Difficulty:** Foundation
- **Dependencies:** K001 (Searchable trait), K014 (Custom engine development), and K020 (Algolia analytics)

## Dependency Graph
**Depends on:** K001 (Searchable trait), K014 (Custom engine development), and K020 (Algolia analytics)
**Depended on by:** Knowledge units that leverage or extend customizing engine searches patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for customizing engine searches.
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