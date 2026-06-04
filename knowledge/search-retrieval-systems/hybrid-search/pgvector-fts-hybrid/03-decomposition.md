# Decomposition: pgvector fts hybrid

## Topic Overview

Combining pgvector (vector similarity) with PostgreSQL's built-in full-text search (tsvector/tsquery) enables hybrid search within a single database. Keyword results from FTS and semantic results from vector search can be fused using Reciprocal Rank Fusion (RRF), weighted summation, or cross-encoder re-ranking. This approach eliminates the need for a separate search infrastructure while providing both exact keyword matching and semantic understanding.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pgvector-fts-hybrid/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pgvector fts hybrid
- **Purpose:** Combining pgvector (vector similarity) with PostgreSQL's built-in full-text search (tsvector/tsquery) enables hybrid search within a single database. Keyword results from FTS and semantic results from vector search can be fused using Reciprocal Rank Fusion (RRF), weighted summation, or cross-encoder re-ranking. This approach eliminates the need for a separate search infrastructure while providing both exact keyword matching and semantic understanding.
- **Difficulty:** Foundation
- **Dependencies:** K041 (pgvector extension), K042 (pgvector HNSW / IVFFlat), and K045 (pgvector + FTS hybrid)

## Dependency Graph
**Depends on:** K041 (pgvector extension), K042 (pgvector HNSW / IVFFlat), and K045 (pgvector + FTS hybrid)
**Depended on by:** Knowledge units that leverage or extend pgvector fts hybrid patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pgvector fts hybrid.
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