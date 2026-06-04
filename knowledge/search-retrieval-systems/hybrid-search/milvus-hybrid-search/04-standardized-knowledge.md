| Metadata | |
|---|---|
| KU ID | K060 |
| Subdomain | hybrid-search |
| Topic | Milvus Hybrid Search |
| Source | Milvus Docs |
| Maturity | Stable |

## Overview

Milvus supports hybrid search combining BM25 sparse vector search with dense vector similarity search within a single query. Documents are indexed with both sparse (BM25-based) and dense (embedding-based) vectors. Queries specify both a dense query vector and sparse query terms, with results fused using RRF. This enables combining keyword precision with semantic understanding in a single database.

## Core Concepts

- **Sparse Vectors**: BM25-based sparse vector representations for keyword matching.
- **Dense Vectors**: Standard embedding vectors for semantic matching.
- **Hybrid Collection**: Collection configured with both sparse and dense vector fields.
- **Hybrid Query**: Single query with both dense vector and sparse vector (or text) input.
- **RRF Fusion**: Results from both retrieval paths combined using Reciprocal Rank Fusion.

## When To Use

- Applications needing both keyword precision and semantic understanding
- Already using Milvus for vector search and want to add BM25 capabilities
- Scenarios where separate keyword and vector engines add too much complexity
- Enterprise search over mixed content (structured + unstructured)

## When NOT To Use

- Only keyword or only semantic search is sufficient (lower complexity)
- Very small datasets where single-path search is fast enough
- When Scout-native integration is needed (no Scout driver for Milvus)
- Teams not already using Milvus (other hybrid solutions may be simpler)

## Best Practices

1. **Configure both sparse and dense fields** in the collection schema.
2. **Pre-process text for sparse vectors**: Milvus can generate sparse vectors from text automatically.
3. **Tune RRF parameters**: Default k=60, but test with your data.
4. **Benchmark individual paths**: Measure keyword-only and vector-only recall before fusing.
5. **Monitor hybrid recall**: Ensure fusion improves over single-path baselines.

## Architecture Guidelines

- Create collection with both `dense_vector` and `sparse_vector` fields.
- Milvus generates sparse vectors internally from text input during indexing.
- Query with both `data` (for sparse vector generation) and `anns_field` (for dense search).
- Fusion uses RRF internally — specify `limit` and `offset` for final pagination.

## Performance Considerations

- Hybrid query latency = max(dense_latency, sparse_latency) + RRF overhead.
- Sparse vector generation from text is fast (no external API calls).
- Indexing dual vectors doubles storage requirements.
- Candidate pool per path affects recall and latency.

## Related Topics

- K059 (Milvus vector database)
- K061 (RRF - Reciprocal Rank Fusion)
- K045 (pgvector + PostgreSQL FTS hybrid)
- K049 (Qdrant hybrid queries)

## AI Agent Notes

- Milvus hybrid search combines BM25 and dense vectors in a single query.
- Handles sparse vector generation internally — no external text processing needed.
- For agents: use for combined keyword + semantic search in Milvus; benchmark each path individually; tune RRF parameters.

## Verification

- [ ] Collection with sparse + dense vector fields created
- [ ] Hybrid queries return combined results
- [ ] Sparse vector generation from text working
- [ ] RRF fusion parameters tuned
- [ ] Individual path recall benchmarked
