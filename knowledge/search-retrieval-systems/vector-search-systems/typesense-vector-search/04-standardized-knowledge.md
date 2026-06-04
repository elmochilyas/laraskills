| Metadata | |
|---|---|
| KU ID | K036 |
| Subdomain | vector-similarity-search |
| Topic | Typesense Vector Search |
| Source | Typesense Docs |
| Maturity | Stable |

## Overview

Typesense supports vector search alongside full-text search within the same collection. Each document can store both text fields and embedding vectors. Queries can combine text search with vector similarity using weighted scoring. Typesense uses HNSW indexing for approximate nearest neighbor (ANN) search and supports cosine, dot product, and L2 distance metrics.

## Core Concepts

- **Hybrid Queries**: Combine `q` (text) with `vector_query` for hybrid search in a single call.
- **HNSW Index**: Typesense uses HNSW for ANN search with configurable parameters.
- **Distance Metrics**: Cosines, dot product, L2 — must match the embedding model's metric.
- **Vector Dimensions**: Embedding vectors up to 4096 dimensions supported.
- **Per-Document Vectors**: Each document can have one vector field for ANN search.

## When To Use

- Semantic search alongside full-text search in the same Typesense collection
- Hybrid search applications needing keyword + vector fusion without external services
- Applications already using Typesense that want to add semantic capabilities

## When NOT To Use

- Pure vector search at large scale (dedicated vector DBs like Qdrant/pgvector are more efficient)
- Very high-dimensional embeddings (>4096 dimensions)
- When text search is not needed (standalone vector DB is simpler)
- Applications needing sparse vector support (Qdrant has better support)

## Best Practices

1. **Match distance metric to embedding model**: Use the metric your embedding model was trained with.
2. **Set `num_vectors` in schema**: Configure HNSW parameters for your dataset size.
3. **Weight text vs vector**: Use `vector_query` weight parameter to balance text and vector relevance.
4. **Test with your data**: Vector search effectiveness varies by content type and embedding model.

## Architecture Guidelines

- Include a `float[]` field in the collection schema for vectors.
- Generate embeddings externally (OpenAI, Cohere, FastEmbed) and include in `toSearchableArray()`.
- Use Typesense's `vector_query` parameter via Scout's callback API for hybrid queries.
- Vector search works within the same Typesense cluster — no additional infrastructure needed.

## Performance Considerations

- HNSW provides sub-100ms search for millions of vectors.
- Index build time increases with vector dimensions and dataset size.
- Vector search performance is memory-bound — ensure adequate RAM.
- Combining text and vector search in one query adds minimal overhead.

## Related Topics

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K035 (Typesense dynamic search parameters)
- K028 (Meilisearch hybrid search)

## AI Agent Notes

- Typesense supports vector search natively alongside full-text search.
- Requires external embedding generation — not built-in like Meilisearch's auto-embeddings.
- For agents: use `vector_query` via callback API; match distance metric to embedding model.

## Verification

- [ ] Embedding field defined in collection schema
- [ ] Embedding generation pipeline implemented
- [ ] Vector queries return semantically relevant results
- [ ] Distance metric matches embedding model
- [ ] HNSW index configured for dataset size
