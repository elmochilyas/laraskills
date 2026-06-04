| Metadata | |
|---|---|
| KU ID | ku-11 |
| Subdomain | vector-similarity-search |
| Topic | Hybrid Search (Vector + Keyword) |
| Source | Academic / Industry |
| Maturity | Stable |

## Overview

Hybrid search combining vector and keyword retrieval merges semantic understanding with exact match precision. This KU focuses on the vector side of hybrid search — how embedding vectors integrate with BM25/full-text for hybrid retrieval. Applies to pgvector + FTS, Qdrant dense + sparse, and similar patterns.

## Core Concepts

- **Dense + Sparse**: Dense vectors for semantics, sparse vectors/BM25 for keywords
- **Fusion Point**: Application-level, engine-level, or database-level
- **RRF Fusion**: Rank-based combination, no score normalization needed
- **Scoring Balance**: α parameter controls keyword vs vector influence
- **Use Cases**: Code search (exact + semantic), e-commerce (product name + concept), RAG

## When To Use

- Search needing both exact matches and semantic understanding
- RAG pipelines requiring high recall
- Applications with mixed content (proper nouns + natural language)

## When NOT To Use

- Pure keyword search is sufficient
- Latency budget cannot accommodate dual retrieval
- No embedding infrastructure available

## Best Practices

1. **Use engine-native hybrid**: Qdrant, Meilisearch, Typesense, Milvus have built-in.
2. **Start with RRF fusion**: No tuning needed.
3. **Parallelize retrieval**: Run vector and keyword queries concurrently.
4. **Limit candidates**: Top-100 per path, fuse to top-20.
5. **Monitor balance**: Ensure both paths contribute to top results.

## Related Topics

- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K061 (RRF)

## AI Agent Notes

- Hybrid is the standard for production-quality semantic search
- Engine-level hybrid is simpler than application-level fusion
- For agents: use engine-level hybrid first, application-level for flexibility

## Verification

- [ ] Keyword retrieval path working
- [ ] Vector retrieval path working
- [ ] Fusion strategy chosen (RRF/weighted)
- [ ] Parallel retrieval implemented
- [ ] Hybrid recall > individual paths
- [ ] Balance monitored
