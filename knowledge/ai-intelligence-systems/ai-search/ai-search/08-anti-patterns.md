---
id: ku-ais-001-ap
title: "AI-Powered Search Systems — Anti-Patterns"
subdomain: "ai-search"
ku-type: "foundation"
date-created: "2026-06-03"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/06-ai-search/08-anti-patterns.md"
---

# AI-Powered Search Systems — Anti-Patterns

## Anti-Patterns Inventory

| # | Anti-Pattern | Category | Severity | Effort |
|---|---|---|---|---|
| AP-01 | Pure Vector-Only Search | Design | High | Medium |
| AP-02 | Reranking Everything | Performance | Medium | Low |
| AP-03 | No Relevance Threshold | Reliability | High | Low |
| AP-04 | Synchronous Indexing | Performance | High | Medium |
| AP-05 | No Query Normalization | Reliability | Medium | Low |

## Repository-Wide Anti-Patterns

- **Embedding Model Version Drift:** Using different embedding models for indexing vs. querying without re-indexing. Results in silent search quality degradation over time.
- **Missing Tenant Isolation:** Not filtering vector search results by tenant ID in multi-tenant systems, leading to cross-tenant data leakage.
- **Cacheless Embedding:** Generating embeddings without content-hash caching, causing redundant API calls, higher latency, and unnecessary costs.

---

### AP-01: Pure Vector-Only Search

**Anti-Pattern:** Relying exclusively on vector similarity for text search without incorporating keyword (full-text) signals.

**Category:** Design

**Detection:**
- Search queries that use `orderByVectorSimilarTo()` without any full-text component
- No `tsvector` column or full-text index on searchable text fields
- RRF (Reciprocal Rank Fusion) scoring not implemented anywhere in the pipeline
- Search implementation using only `ORDER BY vector <=>` in SQL

**Rule Reference:** 05-rules.md — Always Use Hybrid Search for Text

**Skill Reference:** 06-skills.md — Implement Hybrid Search Pipeline with RRF Fusion

**Decision Tree Reference:** 07-decision-trees.md — Implementation Approach (stateless/stateful agent decision does not apply directly; use the hybrid search performance optimization path)

**Root Cause Analysis:**
- Developer unfamiliarity with hybrid search concepts
- Assumption that vector search alone captures all relevance signals
- Prototype shortcuts that become production defaults
- Performance concerns driving removal of the keyword search step

**Impact Analysis:**
- Poor recall for exact matches (proper nouns, product codes, IDs, rare terms)
- Users unable to find documents by name, code, or identifier
- Degraded search quality compared to traditional keyword engines
- False user assumption that "the document doesn't exist"
- Increased reliance on reranking to compensate, adding latency

**Remediation Strategy:**
1. Add tsvector column to searchable tables with appropriate weights
2. Implement full-text search index with `plainto_tsquery` or `websearch_to_tsquery`
3. Implement RRF scoring: `sum(1.0 / (k + rank))` with k=60 as default
4. Combine vector and keyword results before metadata filtering
5. Test recall improvement with known edge cases (exact names, codes)

**Prevention Strategy:**
- Include both vector and full-text search in the initial implementation
- Set architecture guideline: "No text search is production-ready without hybrid search"
- Review SQL in code review — flag pure vector-only search queries
- Use Laravel 13's `hybridSearch()` helper where available

---

### AP-02: Reranking Everything

**Anti-Pattern:** Applying cross-encoder reranking to all candidate results (e.g., 1000 items) instead of limiting to the top-N (e.g., top-20).

**Category:** Performance

**Detection:**
- Reranking API call processing >100 items per query
- Search latency consistently >5 seconds
- Cross-encoder costs linearly scaling with index size
- Monitoring showing reranking stage consuming >90% of total search time

**Rule Reference:** 05-rules.md — Tune ef_search for Latency-Recall Tradeoff

**Skill Reference:** 06-skills.md — Configure and Tune Vector Search Indexes

**Decision Tree Reference:** 07-decision-trees.md — Performance & Optimization (latency vs. throughput)

**Root Cause Analysis:**
- "More is better" assumption about reranking
- Not understanding cross-encoder O(n) complexity
- Using reranking as a crutch for poor initial retrieval quality
- No performance budget defined for search latency

**Impact Analysis:**
- Search latency increases from ~20ms to 5+ seconds
- API costs for cross-encoder scale linearly with candidate count
- Poor user experience due to slow response times
- Server resource exhaustion under concurrent load
- Timeout errors for complex queries

**Remediation Strategy:**
1. Limit reranking to top-20 candidates maximum
2. Improve initial ANN + keyword retrieval quality (tune ef_search, RRF weights)
3. Implement two-stage pipeline: fast retrieval → rerank only top-N
4. Monitor p95 latency with alerting at 2-second threshold

**Prevention Strategy:**
- Set hard limit: reranking scope never exceeds 20 items
- Document the pipeline stages with explicit scope per stage
- Include performance budget in search implementation plan
- Load test with expected concurrent query volume

---

### AP-03: No Relevance Threshold

**Anti-Pattern:** Returning search results without a minimum similarity threshold, showing irrelevant matches with very low scores just to populate results.

**Category:** Reliability

**Detection:**
- Search results with similarity scores < 0.3 (depending on embedding model)
- Users reporting "completely unrelated" search results
- "No results found" never appearing — always returning something
- Click-through rate on bottom results near zero

**Rule Reference:** 05-rules.md — Cache Embeddings with Content-Hash Keys (indirect — query quality impacts cache value)

**Skill Reference:** 06-skills.md — Implement Hybrid Search Pipeline with RRF Fusion

**Decision Tree Reference:** 07-decision-trees.md — Reliability & Error Handling (graceful degradation with fallback content)

**Root Cause Analysis:**
- Product requirement to "always show results"
- Fear of "no results" state being a bad user experience
- Not calibrating `minSimilarity` against the embedding model's output distribution
- Defaulting to LIMIT without WHERE clause filtering on score

**Impact Analysis:**
- Poor user trust in search quality
- Users waste time clicking irrelevant results
- Click analytics polluted with false positives
- Reranking costs wasted on irrelevant candidates
- Degraded perception of overall application quality

**Remediation Strategy:**
1. Analyze embedding score distribution from historical queries
2. Set `minSimilarity` threshold at the 20th percentile of relevant result scores
3. Implement "no results" state with helpful alternatives (suggestions, browse all)
4. Log queries that return zero results for relevance tuning
5. A/B test threshold impact on click-through rate

**Prevention Strategy:**
- Include `minSimilarity` parameter in initial search implementation
- Set a conservative default (0.5 for cosine similarity) and tune down
- Design "no results" UI state upfront — don't treat it as failure
- Monitor zero-result query rate as a search quality metric

---

### AP-04: Synchronous Indexing

**Anti-Pattern:** Generating embeddings and updating vector indexes synchronously during the HTTP request lifecycle on document create/update.

**Category:** Performance

**Detection:**
- Document create/update API endpoints taking >500ms consistently
- Embedding generation API calls happening inside controller methods
- No queue jobs or listeners for embedding generation
- User-facing loading spinners on document save operations

**Rule Reference:** 05-rules.md — Use Async Queue-Based Indexing

**Skill Reference:** 06-skills.md — Implement Hybrid Search Pipeline with RRF Fusion (step 8 in workflow)

**Decision Tree Reference:** 07-decision-trees.md — Performance & Optimization (variable load patterns → queue-based processing)

**Root Cause Analysis:**
- Simplicity of writing inline code vs. dispatching a job
- Not recognizing embedding generation as a slow, external dependency
- Small-scale mindset that ignores concurrent user impact
- Missing queue infrastructure setup

**Impact Analysis:**
- HTTP response times of 200-500ms+ for document operations
- Poor user experience on document upload/creation flows
- Server process blocked on embedding API calls
- Request queue buildup under concurrent document creation
- Higher risk of timeout errors for large document batches

**Remediation Strategy:**
1. Create `GenerateEmbeddingJob` implementing `ShouldQueue`
2. Move embedding generation logic from controller to job `handle()`
3. Dispatch job after document create/update
4. Set up queue worker for the embedding queue
5. Return response immediately; embedding available on next search

**Prevention Strategy:**
- Rule: "No embedding generation in request lifecycle"
- Create job class before implementing document creation endpoint
- Set up queue configuration as prerequisite for search features
- Use Laravel's `dispatch()->afterResponse()` for immediate-fire jobs

---

### AP-05: No Query Normalization

**Anti-Pattern:** Passing raw user search queries to the embedding model and full-text search without normalization (lowercasing, diacritic removal, abbreviation expansion).

**Category:** Reliability

**Detection:**
- Case-sensitive search producing different results for "iPhone" vs "iphone"
- Accented characters returning different results than unaccented versions
- Abbreviations not matching expanded forms ("NYC" vs "New York City")
- Embedding cache misses due to trivial query variations

**Rule Reference:** 05-rules.md — Cache Embeddings with Content-Hash Keys (normalization improves cache hit rate)

**Skill Reference:** 06-skills.md — Implement Hybrid Search Pipeline with RRF Fusion (step 1 in workflow)

**Decision Tree Reference:** 07-decision-trees.md — Implementation Approach (stateless vs. stateful — normalization applies before both paths)

**Root Cause Analysis:**
- Assuming embedding models handle all variance automatically
- Not treating query normalization as part of the search pipeline
- Missing awareness of embedding model tokenizer behavior
- Full-text search configuration without proper text dictionaries

**Impact Analysis:**
- Inconsistent search results for equivalent queries
- Lower cache hit rate for embedding cache (multiple cache entries for same semantic query)
- Poor user experience — users must guess the "correct" spelling/case
- Reduced recall for searches with diacritics or special characters
- Higher embedding API costs from uncached query variations

**Remediation Strategy:**
1. Implement query normalization pipeline: lowercase → strip diacritics → expand abbreviations → trim whitespace
2. Normalize before computing embedding cache key
3. Configure PostgreSQL full-text search with appropriate dictionaries
4. Apply same normalization to indexed document text
5. Test with known edge cases: "résumé" vs "resume", "NYC" vs "New York City"

**Prevention Strategy:**
- Include normalization as step 1 of every search implementation
- Add normalization function as reusable utility from day one
- Test search equivalence with normalized and unnormalized queries in CI
- Document the normalization rules applied for user transparency
