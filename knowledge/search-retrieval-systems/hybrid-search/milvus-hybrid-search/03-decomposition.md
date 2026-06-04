# Decomposition: milvus hybrid search

## Topic Overview

Milvus supports hybrid search by combining dense vector search with BM25-based sparse vector search within a single query. Like Qdrant, this happens server-side using a fusion strategy (RRF or weighted scoring). Milvus's architecture is designed for billion-scale vector datasets with distributed computing capabilities.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
milvus-hybrid-search/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### milvus hybrid search
- **Purpose:** Milvus supports hybrid search by combining dense vector search with BM25-based sparse vector search within a single query. Like Qdrant, this happens server-side using a fusion strategy (RRF or weighted scoring). Milvus's architecture is designed for billion-scale vector datasets with distributed computing capabilities.
- **Difficulty:** Foundation
- **Dependencies:** K059 (Milvus vector database), and K061 (RRF - Reciprocal Rank Fusion)

## Dependency Graph
**Depends on:** K059 (Milvus vector database), and K061 (RRF - Reciprocal Rank Fusion)
**Depended on by:** Knowledge units that leverage or extend milvus hybrid search patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for milvus hybrid search.
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