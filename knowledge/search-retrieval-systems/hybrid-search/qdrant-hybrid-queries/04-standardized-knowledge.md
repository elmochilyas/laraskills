| Metadata | |
|---|---|
| KU ID | K049 |
| Subdomain | hybrid-search |
| Topic | Qdrant Hybrid Queries |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

Qdrant supports native hybrid search by querying both dense and sparse vectors within a single point, then fusing results using RRF. Unlike other hybrid solutions that require separate keyword and vector engines, Qdrant handles both retrieval paths in one query. Each Qdrant point can have multiple named vectors — a dense embedding vector and a sparse vector for keyword-aware search.

## Core Concepts

- **Named Vectors**: Each point can have multiple named vectors (e.g., `"dense"` and `"sparse"`).
- **Dense + Sparse**: Store both dense embeddings and sparse keyword vectors per point.
- **Native RRF Fusion**: Qdrant internally fuses results using RRF.
- **Single Query**: One API call handles both retrieval paths and fusion.
- **With/Without Payload**: Metadata filtering works alongside hybrid queries.

## When To Use

- Hybrid search without managing separate keyword and vector engines
- Applications already using Qdrant that want to add keyword search
- Scenarios requiring rich payload filtering alongside hybrid search
- High-performance hybrid search needs (sub-50ms)

## When NOT To Use

- Only keyword or only semantic search is sufficient
- When using pgvector + PostgreSQL FTS (different infrastructure stack)
- Very small datasets where separate engines aren't justified
- When Scout-native integration is preferred (no Scout driver for Qdrant)

## Best Practices

1. **Configure both dense and sparse vectors** in the Qdrant collection.
2. **Generate sparse vectors** from text using Qdrant's built-in sparse vector extractors or externally.
3. **Tune RRF parameters**: Qdrant's default k=60 may need adjustment.
4. **Test fusion balance**: Adjust per-vector weights if one path dominates.
5. **Monitor individual path performance**: Know each path's recall before fusing.

## Architecture Guidelines

- Create collection with named vectors: `"dense"` (dense embeddings) and `"sparse"` (sparse vectors).
- Generate sparse vectors using Qdrant's built-in tokenizer or external sparse embedding models.
- Query with both named vectors: `query: { "dense": [...], "sparse": {...} }`.
- Use `fusion` parameter: `"rrf"` for RRF fusion.
- Payload filtering works transparently with hybrid queries.

## Performance Considerations

- Hybrid query latency = max(dense_latency, sparse_latency) + fusion overhead.
- Sparse vector search in Qdrant is fast (inverted index-based).
- Storage doubles (dense + sparse), but Qdrant's quantization helps manage size.
- RRF fusion adds sub-millisecond overhead.

## Related Topics

- K048 (Qdrant vector search)
- K061 (RRF - Reciprocal Rank Fusion)
- K028 (Meilisearch hybrid search)
- K045 (pgvector + PostgreSQL FTS hybrid)

## AI Agent Notes

- Qdrant hybrid queries are the most integrated hybrid search — one query handles both paths.
- Requires both dense and sparse named vectors per point.
- For agents: configure named vectors in collection; generate sparse vectors from text; use RRF fusion; test fusion balance with your data.

## Verification

- [ ] Collection with dense + sparse named vectors created
- [ ] Sparse vectors generated from document text
- [ ] Hybrid queries return combined results
- [ ] RRF fusion parameters tuned
- [ ] Payload filtering works with hybrid queries
- [ ] Individual path performance monitored
