# Decomposition: pgvector distance functions

## Topic Overview

pgvector supports multiple distance functions for vector similarity: cosine distance (`<=>`), L2/Euclidean distance (`<->`), and inner product (`<

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pgvector-distance-functions/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pgvector distance functions
- **Purpose:** pgvector supports multiple distance functions for vector similarity: cosine distance (`<=>`), L2/Euclidean distance (`<->`), and inner product (`<
- **Difficulty:** Foundation
- **Dependencies:** K041 (pgvector extension), K042 (pgvector HNSW / IVFFlat), and K044 (pgvector half-precision)

## Dependency Graph
**Depends on:** K041 (pgvector extension), K042 (pgvector HNSW / IVFFlat), and K044 (pgvector half-precision)
**Depended on by:** Knowledge units that leverage or extend pgvector distance functions patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pgvector distance functions.
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