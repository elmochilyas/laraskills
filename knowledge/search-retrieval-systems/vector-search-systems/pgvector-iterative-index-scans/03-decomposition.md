# Decomposition: pgvector iterative index scans

## Topic Overview

pgvector 0.8.0 introduced iterative index scans, solving the long-standing problem of empty result sets when combining vector search with WHERE filters. Pre-0.8, HNSW would return `ef_search` candidates and apply filters afterward — if few candidates matched the filter, results could be empty. Iterative scans expand the candidate pool until the filter is satisfied or a budget is exhausted.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
pgvector-iterative-index-scans/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### pgvector iterative index scans
- **Purpose:** pgvector 0.8.0 introduced iterative index scans, solving the long-standing problem of empty result sets when combining vector search with WHERE filters. Pre-0.8, HNSW would return `ef_search` candidates and apply filters afterward — if few candidates matched the filter, results could be empty. Iterative scans expand the candidate pool until the filter is satisfied or a budget is exhausted.
- **Difficulty:** Foundation
- **Dependencies:** K041 (pgvector extension), and K042 (pgvector HNSW / IVFFlat)

## Dependency Graph
**Depends on:** K041 (pgvector extension), and K042 (pgvector HNSW / IVFFlat)
**Depended on by:** Knowledge units that leverage or extend pgvector iterative index scans patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for pgvector iterative index scans.
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