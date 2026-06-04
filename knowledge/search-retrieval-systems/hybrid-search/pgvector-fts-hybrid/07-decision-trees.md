# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Hybrid Search
**Knowledge Unit:** Pgvector + Postgresql Fts Hybrid Search
**Generated:** 2026-06-03

---

# Decision Inventory

1. Hybrid Search Fusion Strategy
2. Keyword vs Vector Search Weight Allocation
3. Built-in vs Custom Hybrid Implementation

---

# Architecture-Level Decision Trees

## Hybrid Search Fusion Strategy

---

### Decision Context

When implementing Pgvector + Postgresql Fts Hybrid Search, you must decide how to combine keyword (BM25/full-text) and vector (semantic) search results.

### Decision Criteria

* accuracy
* performance

### Decision Tree

Do you need to combine dense (vector) and sparse (keyword) search results?
|
YES -> Implement hybrid search with fusion strategy
    |
    Which fusion method fits your accuracy needs?
    Reciprocal Rank Fusion (RRF) -> Simple, parameter-free, robust
    Weighted scoring -> More control, requires tuning alpha parameter
    |
    Is your search engine providing built-in hybrid support?
    YES -> Use engine-native hybrid (Meilisearch, Qdrant, Milvus)
    NO -> Implement fusion in application layer
NO -> Pure vector or pure keyword search may be sufficient

### Rationale

Hybrid search combines the precision of keyword matching with the semantic understanding of vector search. RRF is simpler and more robust; weighted scoring gives more control at the cost of tuning effort.

### Recommended Default

**Default:** Reciprocal Rank Fusion for simplicity; weighted scoring when relevance tuning is needed.
**Reason:** RRF requires no parameter tuning and is robust across different query types.

### Risks Of Wrong Choice

- Pure vector search for exact-match queries: missed results for specific terms
- Poor fusion weights: degraded search quality compared to single-method approach

### Related Rules

- Create Both GIN and HNSW Indexes
- Use SQL-Level RRF for Simplicity
- Benchmark Individual Paths Before Fusion

### Related Skills

- Configure and Implement Pgvector + Postgresql Fts Hybrid Search

---

## Keyword vs Vector Search Weight Allocation

---

### Decision Context

When implementing Pgvector + Postgresql Fts Hybrid Search, you must determine the weight ratio between keyword and vector components in hybrid search.

### Decision Criteria

* accuracy
* user-experience

### Decision Tree

What is the primary nature of your search queries?
|
Factual/Exact match (product names, SKUs, addresses) -> Weight keyword higher (alpha: 0.7-0.9)
Semantic/Conceptual (cozy bookshelf for small room) -> Weight vector higher (alpha: 0.3-0.5)
Mixed -> Balanced weight (alpha: 0.5-0.6)
|
Do you have user feedback or A/B testing capability?
YES -> Run experiments with different alpha values, measure click-through
NO -> Start with balanced (alpha=0.5) and adjust based on query analysis
|
Does performance vary significantly between search methods on your data?
YES -> Consider query-classification-based adaptive weighting
NO -> Fixed weight is sufficient

### Rationale

The optimal weight between keyword and vector search depends on the nature of your content and queries. Factual queries benefit from keyword weighting; conceptual queries benefit from semantic/vector weighting.

### Recommended Default

**Default:** Balanced alpha=0.5; adjust based on query analysis and user feedback.
**Reason:** Provides a reasonable starting point for most mixed-content applications.

### Risks Of Wrong Choice

- Keyword-heavy for semantic queries: poor recall for conceptual searches
- Vector-heavy for exact matches: missed specific results

### Related Rules

- Create Both GIN and HNSW Indexes
- Use SQL-Level RRF for Simplicity
- Benchmark Individual Paths Before Fusion

### Related Skills

- Configure and Implement Pgvector + Postgresql Fts Hybrid Search

---

## Built-in vs Custom Hybrid Implementation

---

### Decision Context

When implementing Pgvector + Postgresql Fts Hybrid Search, you must decide whether to use engine-native hybrid search or build custom fusion in your application.

### Decision Criteria

* maintainability
* performance

### Decision Tree

Does your search engine natively support hybrid search?
|
YES -> Use built-in hybrid (simpler, optimized, less code)
    |
    Does the built-in implementation meet your relevance requirements?
    YES -> Built-in hybrid is the correct choice
    NO -> Consider supplementing with application-level fusion
NO -> Implement custom fusion in Laravel application layer
    |
    Which fusion method to implement?
    RRF -> Simple to implement, no parameter tuning
    Weighted -> Requires tuning but more flexible
    |
    Are both keyword and vector queries from the same engine?
    YES -> Single connection, simpler coordination
    NO -> Coordinate between two separate engines

### Rationale

Engine-native hybrid search eliminates custom fusion code and is typically optimized for performance. Custom fusion is necessary when using separate engines for keyword and vector search or when advanced fusion logic is needed.

### Recommended Default

**Default:** Use engine-native hybrid when available; custom RRF when it is not.
**Reason:** Minimizes custom code while maintaining search quality.

### Risks Of Wrong Choice

- Custom fusion without optimization: added latency from two round trips
- Engine-native with insufficient control: may not meet specific relevance needs

### Related Rules

- Create Both GIN and HNSW Indexes
- Use SQL-Level RRF for Simplicity
- Benchmark Individual Paths Before Fusion

### Related Skills

- Configure and Implement Pgvector + Postgresql Fts Hybrid Search

