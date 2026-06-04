# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cache frequent queries.
- [ ] Create database-level indexes on metadata filter fields.
- [ ] For hybrid search, tune the fusion weight.
- [ ] Log query performance.
- [ ] Prefer pre-filtering over post-filtering.
- [ ] Database indexes exist on commonly filtered metadata fields.
- [ ] Filter syntax is standardized across providers.
- [ ] Frequent queries are cached with semantic caching.
- [ ] Cache Frequent Query Results
- [ ] Implement Hybrid Search for Text Corpora
- [ ] Prefer Pre-Filtering Over Post-Filtering
- [ ] Set a Minimum Score Threshold
- [ ] Standardize Filter Syntax Across Providers
- [ ] Database indexes exist on commonly filtered metadata fields
- [ ] Filter syntax is standardized across providers (not provider-specific in application code)
- [ ] Frequent queries are cached (semantic cache or exact-match cache)
- [ ] **Apply post-filtering and threshold**: If post-filtering is needed, apply it to the fused results. Discard results below the minimum score threshold.
- [ ] **Build the query object**: Construct a standardized query using a fluent builder pattern: `$store->query($vector)->where('field', 'eq', $value)->topK(10)->minScore(0.7)`.
- [ ] **Decide pre-filter vs. post-filter**: If metadata filters are highly selective (match <50% of data), use pre-filtering to narrow the search space before vector search. For low-selectivity filters (match >90%), post-filtering is acceptable.
- [ ] Cache hit rate >20% for production query volume

---

# Architecture Checklist

- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement immediate secret management improvements
- [ ] Implement input validation and output sanitization layers
- [ ] Implement reconnection logic with last-event-id tracking

---

# Implementation Checklist

- [ ] Cache frequent queries.
- [ ] Create database-level indexes on metadata filter fields.
- [ ] For hybrid search, tune the fusion weight.
- [ ] Log query performance.
- [ ] Prefer pre-filtering over post-filtering.
- [ ] Set a minimum score threshold.
- [ ] Use metadata fields that have high selectivity.
- [ ] **Apply post-filtering and threshold**: If post-filtering is needed, apply it to the fused results. Discard results below the minimum score threshold.
- [ ] **Build the query object**: Construct a standardized query using a fluent builder pattern: `$store->query($vector)->where('field', 'eq', $value)->topK(10)->minScore(0.7)`.
- [ ] **Decide pre-filter vs. post-filter**: If metadata filters are highly selective (match <50% of data), use pre-filtering to narrow the search space before vector search. For low-selectivity filters (match >90%), post-filtering is acceptable.
- [ ] **Execute keyword search (if hybrid)**: Run the original query text through full-text search (BM25, PostgreSQL FTS) with the same filters. Run both searches in parallel for minimal added latency.
- [ ] **Execute vector search**: Run the vector search against the index with pre-filters applied. Measure latency.

---

# Performance Checklist

- [ ] Caching frequent queries: 20-40% hit rate for user-facing search. Cache TTL depends on content update frequency.
- [ ] Filter evaluation: simple equality filters are fast (<1ms); complex nested conditions slow down search.
- [ ] Hybrid search adds latency (vector search + keyword search + fusion). Total: 20-100ms.
- [ ] Post-filtering retrieves top-K results and then filters â€” if the filter matches only 1% of results, effective K is 100x too low.
- [ ] Pre-filtering with a low-selectivity filter (only 10% of vectors match) reduces the search space by 10x â€” significant speedup.
- [ ] Re-ranking with cross-encoder: 50-200ms per query (re-ranking top-20 results). Use only for precision-critical applications.
- [ ] Cache hit rate: 20-40% for user-facing search; TTL depends on content update frequency

---

# Security Checklist

- [ ] Apply access control filters (tenant_id, access_level) server-side; never trust client-provided filter values
- [ ] Ensure filtered results respect data visibility rules â€” a user should never see results they don't have access to
- [ ] Filter evaluation: simple equality filters <1ms; complex nested conditions slow search significantly
- [ ] Hybrid search adds 20-100ms total (vector + keyword + fusion)
- [ ] Log queries with filter parameters for audit trail
- [ ] Pre-filtering with selective filters (10% match) reduces search space by 10x
- [ ] Validate and sanitize metadata filter parameters to prevent injection attacks

---

# Reliability Checklist

- [ ] Ignoring score normalization â€” mixing results from different providers with different score ranges.
- [ ] Not creating database indexes on filter fields â€” metadata filtering is slow without proper indexing.
- [ ] Not setting a minimum score threshold â€” retrieving low-relevance results that add noise.
- [ ] Using non-standardized filter syntax â€” porting query logic between providers requires complete rewrites.
- [ ] Using OR conditions extensively in filters â€” complex filters are slower and harder to optimize.
- [ ] Using post-filtering with selective filters â€” retrieving 10 results and filtering to 1 because the filter matches few items.

---

# Testing Checklist

- [ ] Cache hit rate >20% for production query volume
- [ ] Database indexes exist on commonly filtered metadata fields
- [ ] Database indexes exist on commonly filtered metadata fields.
- [ ] Filter syntax is standardized across providers (not provider-specific in application code)
- [ ] Filter syntax is standardized across providers.
- [ ] Frequent queries are cached (semantic cache or exact-match cache)
- [ ] Frequent queries are cached with semantic caching.
- [ ] Hybrid search (vector + keyword) is available with configurable fusion weight
- [ ] Hybrid search (vector + keyword) is available with configurable fusion weight.
- [ ] Hybrid search successfully retrieves documents matched by keyword (proper nouns, codes) that pure vector search misses

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Single Vector Column for Multiple Semantic Meanings]
- [ ] [No Version Field â€” Can't Distinguish V1 vs V2 Embeddings]
- [ ] [Metadata Bloated with Non-Filterable Fields]
- [ ] [Chunking Model Coupling â€” Same Vector Column for Different Chunk Sizes]
- [ ] [No Unique ID for Vector â€” Can't Deduplicate or Update]
- [ ] Application-Layer Filtering:
- [ ] Filter Overload:
- [ ] Hybrid Search Without Evaluation:
- [ ] No Filter Indexing:
- [ ] Score Obsession:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log queries with filter parameters for audit trail

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


