# Decomposition: cross encoder reranking

## Topic Overview

Cross-encoder re-ranking is a two-stage retrieval approach where an initial fast retrieval (bi-encoder ANN search) returns a candidate set, and a cross-encoder model scores each query-document pair jointly for more accurate relevance assessment. Cross-encoders like Cohere Rerank and BAAI/bge-reranker provide the highest accuracy but add 50-250ms latency per query.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
cross-encoder-reranking/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### cross encoder reranking
- **Purpose:** Cross-encoder re-ranking is a two-stage retrieval approach where an initial fast retrieval (bi-encoder ANN search) returns a candidate set, and a cross-encoder model scores each query-document pair jointly for more accurate relevance assessment. Cross-encoders like Cohere Rerank and BAAI/bge-reranker provide the highest accuracy but add 50-250ms latency per query.
- **Difficulty:** Foundation
- **Dependencies:** K054 (Qdrant cross-encoder re-ranking), K053 (Qdrant FastEmbed), and K069 (RAG pipeline architecture)

## Dependency Graph
**Depends on:** K054 (Qdrant cross-encoder re-ranking), K053 (Qdrant FastEmbed), and K069 (RAG pipeline architecture)
**Depended on by:** Knowledge units that leverage or extend cross encoder reranking patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for cross encoder reranking.
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