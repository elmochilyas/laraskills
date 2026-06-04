# Decomposition: Reranking

## Topic Overview
Reranking improves RAG precision by applying a cross-encoder model to reorder retrieved chunks after initial vector search. While initial retrieval (ANN/HNSW) is fast but approximate, reranking uses a more accurate (but slower) model to score each chunk against the query. This typically improves retrieval precision by 15-30%. Laravel AI SDK supports reranking via Cohere and Jina providers.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-reranking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reranking
- **Purpose:** Reranking improves RAG precision by applying a cross-encoder model to reorder retrieved chunks after initial vector search. While initial retrieval (ANN/HNSW) is fast but approximate, reranking uses a more accurate (but slower) model to score each chunk against the query. This typically improves retrieval precision by 15-30%. Laravel AI SDK supports reranking via Cohere and Jina providers.
- **Difficulty:** Intermediate
- **Dependencies:** KU-021, KU-023, KU-025, KU-026

## Dependency Graph
**Depends on:**
- KU-021
- KU-023
- KU-025
- KU-026

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Two-stage retrieval
- Cross-encoder
- Reranking score
- Opaque model
- Cohere Rerank
- Jina Reranker

**Out of scope:**
- KU-021 topics covered in their respective KUs
- KU-023 topics covered in their respective KUs
- KU-025 topics covered in their respective KUs
- KU-026 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization