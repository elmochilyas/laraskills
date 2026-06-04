# Decomposition: pgvector hnsw ivfflat

## Topic Overview

pgvector provides two index types for approximate nearest neighbor (ANN) search: HNSW (Hierarchical Navigable Small World) and IVFFlat (Inverted File with Flat Compression). HNSW is the production default — offering better recall and query performance at the cost of slower builds and higher memory. IVFFlat builds faster and uses less memory but requires training data and has lower recall.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pgvector-hnsw-ivfflat/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pgvector hnsw ivfflat
- **Purpose:** pgvector provides two index types for approximate nearest neighbor (ANN) search: HNSW (Hierarchical Navigable Small World) and IVFFlat (Inverted File with Flat Compression). HNSW is the production default — offering better recall and query performance at the cost of slower builds and higher memory. IVFFlat builds faster and uses less memory but requires training data and has lower recall.
- **Difficulty:** Foundation
- **Dependencies:** K041 (pgvector extension), K043 (pgvector distance functions), and K044 (pgvector half-precision)

## Dependency Graph
**Depends on:** K041 (pgvector extension), K043 (pgvector distance functions), and K044 (pgvector half-precision)
**Depended on by:** Knowledge units that leverage or extend pgvector hnsw ivfflat patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pgvector hnsw ivfflat.
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