# Decomposition: Embedding Generation

## Topic Overview
Embedding generation converts text into fixed-dimensional vector representations that capture semantic meaning. The Laravel AI SDK provides `Str::toEmbeddings()` for generating embeddings from text, and `Str::of($query)->toEmbeddings()` for embedding queries at retrieval time. Supported providers: OpenAI, Gemini, Cohere, Jina. Embeddings are stored in pgvector columns and queried via cosine similarity.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-embedding-generation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Embedding Generation
- **Purpose:** Embedding generation converts text into fixed-dimensional vector representations that capture semantic meaning. The Laravel AI SDK provides `Str::toEmbeddings()` for generating embeddings from text, and `Str::of($query)->toEmbeddings()` for embedding queries at retrieval time. Supported providers: OpenAI, Gemini, Cohere, Jina. Embeddings are stored in pgvector columns and queried via cosine similarity.
- **Difficulty:** Intermediate
- **Dependencies:** KU-021, KU-022, KU-028, KU-029

## Dependency Graph
**Depends on:**
- KU-021
- KU-022
- KU-028
- KU-029

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Embedding vector
- `Str::toEmbeddings()`
- Cosine similarity
- Embedding dimensions
- Batch embedding
- Normalization

**Out of scope:**
- KU-021 topics covered in their respective KUs
- KU-022 topics covered in their respective KUs
- KU-028 topics covered in their respective KUs
- KU-029 topics covered in their respective KUs

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