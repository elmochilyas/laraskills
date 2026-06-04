---
id: ku-ais-001
title: "AI-Powered Search Systems"
subdomain: "ai-search"
ku-type: "foundation"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/06-ai-search/04-standardized-knowledge.md"
---

# AI-Powered Search Systems

## Metadata
- **Domain:** AI & Intelligence Systems
- **Subdomain:** AI Search (06-ai-search)
- **KU Type:** Foundation
- **Maturity:** Emerging
- **Status:** Standardized
- **Created:** 2026-06-02

## Overview

AI-powered search uses vector embeddings and semantic similarity to understand user intent beyond keyword matching. Laravel 13 provides native vector search through `whereVectorSimilarTo()` and `Str::toEmbeddings()`, enabling production-grade hybrid search (vector + full-text) with reciprocal rank fusion scoring and cross-encoder reranking.

## Core Concepts

- **Semantic Search:** Meaning-aware retrieval using embedding similarity
- **Hybrid Search:** Combined vector + keyword search with RRF scoring
- **Embedding:** Dense vector representation of text capturing semantic meaning
- **ANN Search:** Approximate nearest neighbor search using HNSW indexes
- **Cross-Encoder Reranking:** Second-pass query-document relevance scoring
- **RRF:** Reciprocal Rank Fusion algorithm for merging ranked lists
- **Metadata Filtering:** Facet-based result refinement (tenant, date, category)

## When To Use

- Applications needing "search by meaning" not just "search by keywords"
- Content-rich sites (documentation, articles, knowledge bases)
- E-commerce product search where intent matters more than exact terms
- Multilingual search across mixed-language corpora
- Any search where user queries are short but intent is complex

## When NOT To Use

- Exact-match-only requirements (license plates, serial numbers, IDs)
- High-throughput systems where 200-500ms search latency is unacceptable
- Simple tag/category filtering that doesn't need ranking
- Systems without PostgreSQL (pgvector) or vector database infrastructure
- Prototypes where Algolia or Meilisearch single-vendor solution suffices

## Best Practices

- Always use hybrid search (vector + keyword) — never pure vector for text search
- Start with RRF k=60 as default; tune per corpus
- Cache embeddings with content-hash keys; 60-80% cache hit rate typical
- Set `ef_search=400` for high recall, `ef_search=40` for low latency
- Monitor embedding model version — changing models invalidates all vectors
- Log queries and clicks for relevance tuning and A/B testing
- Use read replicas for vector search under high load
- Partition vector tables by tenant for multi-tenant isolation

## Architecture Guidelines

1. **Pipeline:** Query -> Normalize -> Embed -> ANN Search (top-100) -> Keyword Search (top-100) -> RRF Fusion -> Metadata Filter -> Rerank (top-20 with cross-encoder) -> Return (top-10)
2. **Storage:** pgvector `vector()` column with HNSW index (m=16, ef_construction=64)
3. **Caching:** Embedding cache (Redis, content-hash key, TTL 24h), query result cache (60s TTL for popular queries)
4. **Async Indexing:** Queue-based embedding generation on document create/update
5. **Monitoring:** Track p50/p95 latency per pipeline stage, recall@10, NDCG@10

## Performance Considerations

- ANN on 1M vectors: 5-10ms (HNSW, ef_search=40)
- Full hybrid pipeline: 10-20ms (without reranking)
- Reranking 20 items: 200-500ms (API call)
- Total with reranking: 250-550ms per query
- Embedding generation: 50-150ms per query
- HNSW index memory: ~1.2GB per million vectors (1536d, float32)
- Batch embedding (100 docs): 200-500ms

## Security Considerations

- Validate and sanitize search queries (injection prevention)
- Implement tenant-aware metadata filtering to prevent cross-tenant data leakage
- Never expose raw vector values in API responses
- Rate-limit search endpoints to prevent embedding API cost abuse
- Log anomalous query patterns (potential data scraping)

## Common Mistakes

- Using different embedding models for indexing vs. querying
- Setting `ef_search` too low (<40) causing poor recall
- Not filtering by tenant in multi-tenant systems
- Reranking on wrong document field (title vs. body)
- Forgetting `minSimilarity` threshold — returning irrelevant results
- Mixing embedding models in one index

## Anti-Patterns

- **Pure Vector-Only Search:** Ignores keyword signals — fails on exact matches
- **Reranking Everything:** Reranking 1000 items is expensive and unnecessary (top-20 suffices)
- **No Relevance Threshold:** Returning results with 0.1 similarity because something must show
- **Synchronous Indexing:** User waits for embedding generation on upload
- **No Query Normalization:** Case-sensitive, diacritic-sensitive search with embedding mismatch

## Examples

### Hybrid Search with pgvector
```sql
WITH vector_results AS (
    SELECT id, 1 - (vector <=> :query_embedding) AS score
    FROM documents
    ORDER BY vector <=> :query_embedding
    LIMIT 100
),
keyword_results AS (
    SELECT id, ts_rank(tsv, plainto_tsquery('english', :query)) AS score
    FROM documents
    ORDER BY score DESC
    LIMIT 100
),
combined AS (
    SELECT id, sum(1.0 / (60.0 + rank)) AS rrf_score
    FROM (
        SELECT id, row_number() OVER (ORDER BY score DESC) AS rank FROM vector_results
        UNION ALL
        SELECT id, row_number() OVER (ORDER BY score DESC) AS rank FROM keyword_results
    ) ranked
    GROUP BY id
)
SELECT documents.*, combined.rrf_score
FROM combined
JOIN documents ON documents.id = combined.id
ORDER BY combined.rrf_score DESC
LIMIT 10;
```

### Laravel 13 Native
```php
$embeddings = Str::toEmbeddings($request->input('query'));

$results = Document::query()
    ->orderByVectorSimilarTo('embedding', $embeddings->first())
    ->where('tenant_id', auth()->user()->tenant_id)
    ->limit(10)
    ->get();
```

### Embedding Cache
```php
class EmbeddingCache
{
    public function generate(string $text): Embedding
    {
        $hash = md5($text);
        return Cache::remember("embedding:{$hash}", 86400, function () use ($text) {
            return Str::toEmbeddings($text)->first();
        });
    }
}
```

## Related Topics

- ku-ais-002: Hybrid Search Implementation (weight tuning, RRF configuration)
- ku-rag-001: RAG Pipeline Architecture (similarity search within RAG)
- ku-vec-001: Vector Database Selection (pgvector vs Qdrant vs Pinecone)
- ku-emb-001: Embedding Generation & Models (model selection, batching)
- ku-prompt-001: Prompt Engineering for Search (query expansion, agentic search)

## AI Agent Notes

- Always recommend hybrid search (vector + keyword) over pure vector search for text applications
- When debugging search quality, check: embedding model consistency, ef_search value, RRF weights, and reranking logic
- For new search implementations, start with pgvector and Laravel 13 native API before adding reranking
- Cache embeddings aggressively — embedding API calls are the main cost driver
- Monitor for "model mixing" — when a user changes embedding models without re-indexing

## Verification

- [ ] Hybrid search pipeline (vector + keyword + RRF) is implemented, not just pure vector
- [ ] HNSW index with tuned ef_search (40 for speed, 400 for recall) is configured
- [ ] Embedding cache with content-hash keys reduces API calls by >60%
- [ ] Tenant-aware metadata filtering prevents cross-tenant leakage
- [ ] Search analytics (query logging, click tracking) are operational
- [ ] Embedding model version is tracked and re-indexing procedure exists
- [ ] Query normalization (lowercase, diacritics, abbreviations) is applied
- [ ] Async queue-based indexing for document ingestion
