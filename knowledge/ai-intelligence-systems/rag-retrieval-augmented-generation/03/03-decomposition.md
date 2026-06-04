# Decomposition: Embedding Generation

## Topic Overview

Embedding generation converts text into dense vector representations that capture semantic meaning. In RAG systems, embeddings are the foundation of retrieval â€” documents are embedded and stored in a vector index; queries are embedded with the same model, and the vector database finds the nearest neighbors. The choice of embedding model, dimensions, and generation strategy directly impacts retrieval quality, storage requirements, and query latency.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-03/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Embedding Generation
- **Purpose:** Embedding generation converts text into dense vector representations that capture semantic meaning. In RAG systems, embeddings are the foundation of retrieval â€” documents are embedded and stored in a vector index; queries are embedded with the same model, and the vector database finds the nearest neighbors. The choice of embedding model, dimensions, and generation strategy directly impacts retrieval quality, storage requirements, and query latency.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-05, ku-01, ku-01

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-05
- ku-01
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Embedding Model:** A neural network that maps text to a vector space. Common models: OpenAI text-embedding-3-small/large, BGE, E5, Instructor, Cohere Embed.
- **Vector Dimensions:** The length of the embedding vector. Higher dimensions capture more information but require more storage. Typical: 384 (small), 768 (medium), 1536 (OpenAI), 3072 (OpenAI large).
- **Normalization:** Embedding vectors are typically normalized to unit length for cosine similarity search.
- **Batch Embedding:** Generating embeddings for multiple texts in a single API call (more efficient than individual calls).
- **Query Embedding vs. Document Embedding:** Some embedding models support asymmetric embeddings (different prefixes for query and document texts).
- **Dimensionality Reduction:** Reducing embedding dimensions post-generation (e.g., via PCA or Matryoshka embeddings) to save storage and speed up search.
- **Embedding Caching:** Caching query embeddings to avoid redundant API calls for repeated or similar queries.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

