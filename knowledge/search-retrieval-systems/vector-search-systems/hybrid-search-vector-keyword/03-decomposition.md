# Decomposition: hybrid search vector keyword

## Topic Overview

Hybrid search combining vector and keyword retrieval merges semantic understanding with exact match precision. This KU focuses on the vector side of hybrid search — how embedding vectors integrate with BM25/full-text for hybrid retrieval. Applies to pgvector + FTS, Qdrant dense + sparse, and similar patterns.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


hybrid-search-vector-keyword/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### hybrid search vector keyword
- **Purpose:** Hybrid search combining vector and keyword retrieval merges semantic understanding with exact match precision. This KU focuses on the vector side of hybrid search — how embedding vectors integrate with BM25/full-text for hybrid retrieval. Applies to pgvector + FTS, Qdrant dense + sparse, and simi...
- **Difficulty:** Foundation
- **Dependencies:** K045, K049, K061

## Dependency Graph
**Depends on:** K045, K049, K061
**Depended on by:** Knowledge units that leverage or extend hybrid search vector keyword patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for hybrid search vector keyword.
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
