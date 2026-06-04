# Decomposition: pgvector indexing hnsw ivfflat

## Topic Overview

pgvector supports two ANN index types: IVFFlat (Inverted File with Flat Compression) and HNSW (Hierarchical Navigable Small World). HNSW provides better query performance (faster, higher recall) but slower build time and more memory. IVFFlat builds faster, uses less memory, but has lower recall at equivalent parameters.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


pgvector-indexing-hnsw-ivfflat/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### pgvector indexing hnsw ivfflat
- **Purpose:** pgvector supports two ANN index types: IVFFlat (Inverted File with Flat Compression) and HNSW (Hierarchical Navigable Small World). HNSW provides better query performance (faster, higher recall) but slower build time and more memory. IVFFlat builds faster, uses less memory, but has lower recall a...
- **Difficulty:** Foundation
- **Dependencies:** K041, K042, K013

## Dependency Graph
**Depends on:** K041, K042, K013
**Depended on by:** Knowledge units that leverage or extend pgvector indexing hnsw ivfflat patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pgvector indexing hnsw ivfflat.
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
