# Decomposition: qdrant hybrid queries

## Topic Overview

Qdrant provides native hybrid search by combining dense vector search (from embedding models) with sparse vector search (representing keyword importance, like BM25). The fusion happens server-side using a configurable scoring strategy (RRF or DBSF). This eliminates the need for application-level fusion logic.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
qdrant-hybrid-queries/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### qdrant hybrid queries
- **Purpose:** Qdrant provides native hybrid search by combining dense vector search (from embedding models) with sparse vector search (representing keyword importance, like BM25). The fusion happens server-side using a configurable scoring strategy (RRF or DBSF). This eliminates the need for application-level fusion logic.
- **Difficulty:** Foundation
- **Dependencies:** K048 (Qdrant vector search), K061 (RRF - Reciprocal Rank Fusion), and K062 (Cross-encoder re-ranking)

## Dependency Graph
**Depends on:** K048 (Qdrant vector search), K061 (RRF - Reciprocal Rank Fusion), and K062 (Cross-encoder re-ranking)
**Depended on by:** Knowledge units that leverage or extend qdrant hybrid queries patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for qdrant hybrid queries.
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