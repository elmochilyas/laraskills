---
id: ku-ais-001
title: "AI-Powered Search Systems"
subdomain: "ai-search"
ku-type: "foundation"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "draft"
file-path: "research/workspaces/ai-intelligence-systems/06-ai-search/02-knowledge-unit.md"
---

# AI-Powered Search Systems

## Executive Summary

AI-powered search in Laravel combines vector embeddings, semantic similarity, and traditional full-text search to deliver relevance-ranked results that understand user intent beyond keyword matching. The Laravel 13 AI SDK brings native vector search capabilities via `whereVectorSimilarTo()` and `Str::toEmbeddings()`, enabling hybrid search (vector + full-text) with reciprocal rank fusion (RRF) scoring. AI-powered reranking via cross-encoder models (Cohere, Jina, VoyageAI) further improves precision by re-scoring top-K results.

## Core Concepts

- **Semantic Search:** Search based on meaning and intent, not keyword matching. Uses embeddings to represent documents and queries as vectors.
- **Hybrid Search:** Combines vector similarity (semantic) with keyword/sparse retrieval (BM25/tsvector) using RRF or weighted scoring for balanced relevance.
- **Reciprocal Rank Fusion (RRF):** A ranking algorithm that combines results from multiple ranking systems by scoring each document as `1/(k + rank)` per system, then summing scores.
- **Embedding Generation:** Converting text to vector representations using models like `text-embedding-3-small`, `voyage-3`, or `Str::toEmbeddings()` in Laravel.
- **ANN Search:** Approximate Nearest Neighbor search using HNSW indexes in pgvector for fast similarity lookups.
- **Cross-Encoder Reranking:** A computationally expensive but highly accurate second-pass ranking that evaluates query-document pairs directly.
- **Metadata Filtering:** Pre-filtering or post-filtering search results by structured attributes (tenant, category, date, access level).
- **Multilingual Search:** Semantic search across languages using multilingual embedding models.

## Mental Models

- **Iceberg Model:** Keyword search is the tip (visible); semantic search is the mass below (context, intent, meaning). Hybrid search keeps both visible.
- **Funnel Model:** Retrieve wide (top-100 with ANN) -> Rerank deep (top-20 with cross-encoder) -> Present narrow (top-5 with metadata filtering).
- **Translation Bridge:** Think of embeddings as translating both queries and documents into a common "meaning space" where distance equals semantic difference.

## Internal Mechanics

- The search pipeline: Query -> Embedding Generation -> Vector Search (ANN) -> Optional Keyword Search -> RRF Fusion -> Metadata Filtering -> Reranking -> Result Presentation.
- Laravel 13's `vector()` column stores embeddings. HNSW indexes enable fast ANN search with configurable `ef_search` for speed/recall tradeoff.
- `whereVectorSimilarTo()` wraps the `<=>` operator for cosine distance. Raw SQL with `<->` or `<#>` operators provides L2 and inner-product distances.
- Hybrid search in pgvector: `SELECT * FROM documents ORDER BY (vector <=> :query_embedding) * :vector_weight + (ts_rank(tsv, query)) * :keyword_weight`.
- RRF combines results: `1/(60 + rank_vector) + 1/(60 + rank_keyword)` gives equal weight by default; adjust `k` to bias one system.
- Reranking passes query + candidate document pairs to a cross-encoder model, returning relevance scores 0-1.

## Patterns

- **Embedding-Only Search:** Simple, fast, single query. Best when corpus is uniformly semantic (descriptions, articles).
- **Hybrid Search (60/40):** Default production pattern. 60% vector + 40% keyword weight. Tune per domain.
- **Multilingual Hybrid:** Use a multilingual embedding model (voyage-3, intfloat-multilingual) with keyword search per language.
- **Reranked Pipeline:** Retrieve 100 with ANN, rerank 20 with Cohere, return 5 with filters. Best for high-precision requirements.
- **Agentic Search:** An AI agent decides search strategy (query expansion, facet selection, threshold adjustment) dynamically.

## Architectural Decisions

| Decision | Option A | Option B | Rationale |
|----------|----------|----------|-----------|
| Search Type | Hybrid (vector + keyword) | Pure semantic | Hybrid wins for general-purpose search (codes, names, exact matches) |
| Vector Database | pgvector (same PostgreSQL) | Dedicated Qdrant | pgvector wins for <50M vectors, simplified ops |
| Reranking | Cohere Rerank (API) | VoyageAI Rerank | Cohere has broader language support |
| Embedding Model | voyage-3 (general) | text-embedding-3-small | voyage-3 has better multilingual performance |
| Fusion Method | RRF (k=60) | Weighted sum | RRF is simpler, more robust to score distribution differences |

## Tradeoffs

- **Recall vs. Latency:** Higher `ef_search` values improve recall but increase query latency. 400 for high-recall, 40 for low-latency.
- **Index Build Time vs. Query Speed:** HNSW builds slower than IVFFlat but queries faster. Build during off-peak.
- **Reranking Cost vs. Quality:** Cross-encoder reranking costs ~0.01¢ per query-document pair. For 100 documents, ~1¢/query.
- **Single-Table vs. Separate Index:** Same-table vector + text is simpler but harder to optimize individually.
- **Freshness vs. Consistency:** Real-time index updates can cause inconsistency during re-indexing.

## Performance Considerations

- ANN search on 1M vectors with HNSW (m=16, ef_search=40): ~5-10ms
- Full hybrid search with RRF: ~10-20ms
- Reranking 20 items: ~200-500ms (API call to Cohere/Jina)
- Total pipeline (retrieve + rerank): ~250-550ms
- Embedding generation: ~50-150ms per query (API call)
- Batch embedding 100 documents: ~200-500ms
- HNSW index size: ~1.5MB per 10K vectors (1536 dimensions, float32)
- Memory for HNSW graph: ~1.2GB per million vectors

## Production Considerations

- Cache embedding results: Content-hash based, TTL 24h. 60-80% cache hit rate.
- Use async queue for indexing: Dispatch chunked embedding jobs on document create/update.
- Monitor embedding model version: Changing models invalidates all stored vectors.
- Set up search analytics: Log queries, clicks, and result positions for relevance tuning.
- Implement query normalization: Lowercase, strip diacritics, expand abbreviations.
- Use read replicas for vector search on high-traffic applications.
- Partition pgvector tables by tenant or date range for multi-tenant isolation.

## Common Mistakes

- Using the same embedding model for indexing and querying but with different configurations.
- Setting `ef_search` too low (<40) resulting in poor recall, especially with large datasets.
- Mixing embedding models within a single index (vectors must be comparable).
- Not handling out-of-vocabulary terms in keyword search component.
- Reranking with the wrong field (reranking on title when body has the signal).
- Ignoring metadata filtering performance — unindexed filters scan all candidates.
- Forgetting to set `minSimilarity` threshold, returning irrelevant results.

## Failure Modes

- **Silent Quality Degradation:** Embedding model provider changes output dimensions without notice. Monitor vector dimensionality.
- **Index Bloat:** HNSW index grows over time. Schedule periodic `REINDEX` or use `VACUUM`.
- **Reranking Timeout:** Cross-encoder API calls timeout under load. Set conservative timeouts and fallback to non-reranked results.
- **Hybrid Search Imbalance:** One search method dominates the other after scoring changes. Monitor RRF contributions.
- **Cache Poisoning:** Stale embeddings served after model update. Use versioned cache keys.

## Ecosystem Usage

- **Laravel AI SDK:** `Str::toEmbeddings()`, `whereVectorSimilarTo()`, `SimilaritySearch` tool for agentic RAG.
- **pgvector:** Native PostgreSQL extension with HNSW indexing, cosine/L2/IP distance operators.
- **Cohere Rerank:** Cross-encoder reranking API, 1K context, multilingual support.
- **Jina Rerank:** Open-source reranking models, `jina-reranker-v2-base-multilingual`.
- **VoyageAI:** `rerank-2.5` model, 8K context, code-aware reranking.
- **Elasticsearch:** Traditional full-text search, can be paired with external embedding service for hybrid search.
- **Meilisearch:** Fast typo-tolerant search, now adding vector search support.

## Related Knowledge Units

- ku-ais-002: Hybrid Search Implementation (06-ai-search)
- ku-rag-001: RAG Pipeline Architecture (04-rag-retrieval-augmented-generation)
- ku-vec-001: Vector Database Selection (05-vector-databases)
- ku-emb-001: Embedding Generation & Models (02-laravel-ai-sdk)
- ku-prompt-001: Prompt Engineering for Search (10-prompt-engineering)

## Research Notes

- Laravel 13 native vector search (March 2026) standardizes the API but pgvector has been viable since 2021.
- RRF with k=60 is the default recommendation from pgvector documentation and community benchmarks.
- Cross-encoder reranking consistently adds +10-15% NDCG@10 in production benchmarks.
- The industry trend is toward unified hybrid search as the default, with pure vector search reserved for media/embedding-only use cases.
- Query expansion (generating multiple query variants via LLM) is an emerging pattern that improves recall by 10-20%.
