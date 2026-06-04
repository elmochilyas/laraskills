# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Relevance and Ranking
**Knowledge Unit:** Qdrant Re-Ranking With Cross-Encoders
**Generated:** 2026-06-03

---

# Decision Inventory

1. Relevance Tuning Strategy
2. BM25 vs Vector Similarity for Relevance
3. Cross-Encoder Reranking Strategy

---

# Architecture-Level Decision Trees

## Relevance Tuning Strategy

---

### Decision Context

When implementing Qdrant Re-Ranking With Cross-Encoders, you must decide which relevance factors to prioritize and how to configure ranking.

### Decision Criteria

* accuracy
* user-experience

### Decision Tree

What is the primary goal of your search relevance tuning?
|
Improve result ordering -> Configure ranking rules/attributes
    |
    Which engine are you using?
    Meilisearch -> Use rankingRules (words, typo, proximity, attribute, sort)
    Typesense -> Configure text_match_relevance and ranking hints
    Algolia -> Use custom ranking and replica indices
    |
    Do you need field-specific boosting?
    YES -> Set higher rank for title/name fields vs description
    NO -> Default ranking is often sufficient
Filter/Refine results -> Use faceted search with filtering
    |
    Are facets declared as filterable attributes?
    YES -> Apply where() clauses in Scout queries
    NO -> Declare filterable attributes first in engine config

### Rationale

Relevance tuning directly impacts user satisfaction. Engine-specific ranking rules provide different levels of control, from Meilisearch simple rankingRules to Algolia complex custom ranking.

### Recommended Default

**Default:** Start with default ranking; tune progressively based on query analysis.
**Reason:** Avoids over-optimization before understanding actual user search patterns.

### Risks Of Wrong Choice

- Over-tuned ranking: biased results that miss relevant content
- No faceting declaration: filters silently ignored, confusing users

### Related Rules

- Oversample 2-5x for Re-Ranking Quality
- Implement ANN Fallback for Re-Ranking
- Cache Frequent Re-Ranker Results

### Related Skills

- Configure and Implement Qdrant Re-Ranking With Cross-Encoders

---

## BM25 vs Vector Similarity for Relevance

---

### Decision Context

When implementing Qdrant Re-Ranking With Cross-Encoders, you must choose between BM25 keyword relevance and vector similarity for ranking search results.

### Decision Criteria

* accuracy
* performance

### Decision Tree

Is your content primarily text-based with clear keywords?
|
YES -> BM25 keyword relevance works well
    |
    Do users search with exact terms found in your content?
    YES -> BM25 is efficient and effective
    NO -> Consider supplementing with vector similarity
NO -> Is semantic understanding of queries important?
    YES -> Vector similarity provides better semantic matching
    NO -> BM25 is simpler and sufficient
|
Do you need both keyword precision and semantic understanding?
YES -> Implement hybrid ranking combining BM25 and vector scores
NO -> Single method is sufficient

### Rationale

BM25 excels at exact keyword matching and is computationally efficient. Vector similarity captures semantic relationships but requires embedding generation and more compute. Hybrid approaches combine the strengths of both.

### Recommended Default

**Default:** BM25 for keyword-heavy content; hybrid ranking for diverse content types.
**Reason:** BM25 is zero-configuration and efficient for most text search use cases.

### Risks Of Wrong Choice

- Vector-only for keyword queries: missed exact-match results
- BM25-only for semantic queries: poor recall for conceptual searches

### Related Rules

- Oversample 2-5x for Re-Ranking Quality
- Implement ANN Fallback for Re-Ranking
- Cache Frequent Re-Ranker Results

### Related Skills

- Configure and Implement Qdrant Re-Ranking With Cross-Encoders

---

## Cross-Encoder Reranking Strategy

---

### Decision Context

When implementing Qdrant Re-Ranking With Cross-Encoders, you must decide whether to use cross-encoder reranking to improve result relevance.

### Decision Criteria

* accuracy
* latency

### Decision Tree

Is search result accuracy critical for your application?
|
YES -> Consider cross-encoder reranking as a second-pass reordering
    |
    Can you tolerate the added latency (50-500ms per query)?
    YES -> Implement cross-encoder reranking on top-K results
    NO -> Bi-encoder (embedding) similarity is faster but less accurate
NO -> First-pass ranking (BM25 or vector similarity) is sufficient
|
What is the reranking pool size?
Small (<100 results) -> Cross-encoder latency is acceptable
Large (>1000 results) -> Limit candidates with first-pass retrieval

### Rationale

Cross-encoders provide significantly better relevance than bi-encoders by jointly encoding the query and document pair. However, the computational cost makes them unsuitable as a first-pass retriever for large collections.

### Recommended Default

**Default:** Cross-encoder reranking on top 20-100 results for accuracy-critical applications.
**Reason:** Balances improved relevance with acceptable latency.

### Risks Of Wrong Choice

- No reranking on large pools: suboptimal result ordering
- Reranking too many results: unacceptable query latency

### Related Rules

- Oversample 2-5x for Re-Ranking Quality
- Implement ANN Fallback for Re-Ranking
- Cache Frequent Re-Ranker Results

### Related Skills

- Configure and Implement Qdrant Re-Ranking With Cross-Encoders

