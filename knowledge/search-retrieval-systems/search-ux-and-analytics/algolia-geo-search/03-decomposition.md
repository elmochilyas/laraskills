# Decomposition: algolia geo search

## Topic Overview

Algolia geo-search enables filtering and ranking search results by geographic location. It supports lat/lng coordinate storage, radius filtering, bounding box filtering, and "around" (nearest) queries. In Laravel Scout, geo-search parameters are passed via the `options()` callback or the `search()` callback closure for engine-specific features.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
algolia-geo-search/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### algolia geo search
- **Purpose:** Algolia geo-search enables filtering and ranking search results by geographic location. It supports lat/lng coordinate storage, radius filtering, bounding box filtering, and "around" (nearest) queries. In Laravel Scout, geo-search parameters are passed via the `options()` callback or the `search()` callback closure for engine-specific features.
- **Difficulty:** Foundation
- **Dependencies:** K018 (Algolia driver setup), K013 (Customizing engine searches), and K037 (Typesense geo-search)

## Dependency Graph
**Depends on:** K018 (Algolia driver setup), K013 (Customizing engine searches), and K037 (Typesense geo-search)
**Depended on by:** Knowledge units that leverage or extend algolia geo search patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for algolia geo search.
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