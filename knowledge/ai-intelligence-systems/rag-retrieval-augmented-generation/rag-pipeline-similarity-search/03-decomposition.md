# Decomposition: RAG Pipeline with SimilaritySearch

## Topic Overview
The full RAG pipeline in Laravel: document ingestion â†’ chunking â†’ embedding generation â†’ vector storage â†’ similarity search â†’ context injection â†’ LLM generation. The Laravel AI SDK provides the `SimilaritySearch` tool that plugs directly into Eloquent models backed by pgvector. `Str::toEmbeddings()` generates embeddings, `whereVectorSimilarTo()` queries similarity, and the built-in tool handles context injection.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-rag-pipeline-similarity-search/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### RAG Pipeline with SimilaritySearch
- **Purpose:** The full RAG pipeline in Laravel: document ingestion â†’ chunking â†’ embedding generation â†’ vector storage â†’ similarity search â†’ context injection â†’ LLM generation. The Laravel AI SDK provides the `SimilaritySearch` tool that plugs directly into Eloquent models backed by pgvector. `Str::toEmbeddings()` generates embeddings, `whereVectorSimilarTo()` queries similarity, and the built-in tool handles context injection.
- **Difficulty:** Intermediate
- **Dependencies:** KU-022, KU-023, KU-024, KU-025, KU-026, KU-027

## Dependency Graph
**Depends on:**
- KU-022
- KU-023
- KU-024
- KU-025
- KU-026
- KU-027

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- RAG stages
- SimilaritySearch
- Str::toEmbeddings()
- whereVectorSimilarTo()
- minSimilarity
- Context injection

**Out of scope:**
- KU-022 topics covered in their respective KUs
- KU-023 topics covered in their respective KUs
- KU-024 topics covered in their respective KUs
- KU-025 topics covered in their respective KUs
- KU-026 topics covered in their respective KUs
- KU-027 topics covered in their respective KUs

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