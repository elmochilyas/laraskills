| Metadata | |
|---|---|
| Knowledge Unit ID | ku-01 |
| Subdomain | hybrid-search |
| Topic | Hybrid Search Concept |
| Source | Academic / Industry |
| Maturity | Stable |

## Overview

Hybrid search combines keyword-based (BM25, full-text) and semantic (vector embedding) retrieval to get the best of both approaches. Keyword search excels at exact matches, proper nouns, and rare terms. Vector search excels at conceptual matches, synonyms, and understanding intent. Fusion algorithms combine results into a single ranked list.

## Core Concepts

- **Keyword Retrieval**: BM25, TF-IDF, or full-text search — exact term matching
- **Semantic Retrieval**: Vector similarity search — conceptual meaning matching
- **Fusion**: Combining two result sets into one — RRF, weighted sum, or cross-encoder
- **Complementary Strengths**: Keyword handles specificity, vector handles semantics
- **Fusion Points**: Engine-level (native), database-level (SQL), application-level (PHP), microservice-level

## When To Use

- Applications needing both exact keyword matching and semantic understanding
- Search over mixed content (proper nouns + natural language)
- RAG pipelines where retrieval quality directly impacts answer quality
- Improving long-tail query performance (queries with few keyword matches)

## When NOT To Use

- Pure keyword search is sufficient (code search, product SKUs, exact match domains)
- Latency-sensitive applications where extra retrieval cost is prohibitive
- Very small datasets where keyword search already provides good results
- Teams without embedding generation infrastructure or budget

## Best Practices

1. **Start with keyword search**: Add vector search only if keyword recall is insufficient.
2. **Test with representative queries**: Hybrid improves some queries, not all.
3. **Tune fusion parameters**: Default RRF k=60 may not be optimal for your data.
4. **Limit candidate pool**: Retrieve top-100 from each path, fuse to top-20.
5. **Benchmark individual paths**: Know each path's recall before fusing.

## Architecture Guidelines

- Engine-level (simplest): Meilisearch, Typesense, Qdrant, Milvus native hybrid
- Database-level: pgvector + PostgreSQL FTS with RRF in SQL
- Application-level: Query two engines separately, fuse in PHP
- Microservice-level: Dedicated hybrid service for multi-engine fusion

## Performance Considerations

- Hybrid search latency ≈ max(keyword_latency, vector_latency) + fusion_overhead
- Fusion overhead: RRF ~1ms, weighted ~1ms, cross-encoder 50-200ms
- Dual indexing doubles storage and memory requirements
- Candidate pool size vs latency tradeoff: larger pool = better recall but slower

## Security Considerations

- Each retrieval path has its own security model (API keys, auth)
- Embedding queries may send data to external API providers
- Fusion layer must handle partial failures (one path down)
- Ensure consistent access control across both retrieval paths

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Adding vector search without need | Hype-driven | Unnecessary cost | Benchmark keyword first |
| Not normalizing scores | Different scales per engine | Fusion dominated by one path | Use RRF (rank-based) |
| Fusing too many candidates | Over-engineering | Latency increase | Cap at top-100 per path |
| Ignoring individual path quality | Assumption fusion fixes all | Poor overall results | Optimize each path first |

## Anti-Patterns

- **Fusion as band-aid for poor retrieval**: Fix each path individually first
- **Running both queries sequentially**: Always parallelize for lowest latency
- **Unlimited candidate pooling**: Diminishing returns beyond top-100
- **Ignoring one path dominating**: Monitor fusion balance via analytics

## Examples

`php
// Application-level hybrid search in Laravel
 = Product::search()->take(100)->keys();
 = VectorSearch::search(, topK: 100);
 = ReciprocalRankFusion::fuse(, , k: 60, topK: 20);
`

## Related Topics

- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K061 (RRF - Reciprocal Rank Fusion)
- K062 (Cross-encoder re-ranking)
- K028 (Meilisearch hybrid search)

## AI Agent Notes

- Hybrid search is the standard for production RAG pipelines
- Fusion strategy choice (RRF vs weighted vs cross-encoder) is the key architectural decision
- Engine-level hybrid is simplest, application-level gives most control
- For agents: start with engine-level hybrid, add cross-encoder for quality-sensitive applications

## Verification

- [ ] Keyword search baseline established
- [ ] Vector search capabilities available (pgvector, Qdrant, etc.)
- [ ] Fusion method chosen (RRF/weighted/cross-encoder)
- [ ] Hybrid search benchmarked against keyword-only
- [ ] Candidate pool size tuned
- [ ] Fusion balance monitored
