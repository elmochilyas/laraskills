# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Search System Decision Guides
**Knowledge Unit:** Search Appliance Comparison
**Generated:** 2026-06-03

---

# Decision Inventory

1. Search Appliance Comparison Strategy
2. Single vs Multi-Engine Architecture
3. Full-Text vs Vector vs Hybrid Search Decision

---

# Architecture-Level Decision Trees

## Search Appliance Comparison Strategy

---

### Decision Context

When implementing Search Appliance Comparison, you must evaluate and select the appropriate search engine or combination of engines for your application.

### Decision Criteria

* architectural
* cost
* maintainability

### Decision Tree

What is the scale of your search requirements?
|
Small (<10K records, basic text search) -> Database FULLTEXT or Scout collection engine
Medium (10K-1M records, faceted search) -> Meilisearch or Typesense
Large (>1M records, advanced features) -> Algolia or Elasticsearch
|
Do you need vector/hybrid search capabilities?
YES -> Evaluate dedicated vector DBs (Qdrant, Pinecone) or hybrid engines
NO -> Traditional full-text search engines are sufficient
|
Self-hosted or managed/cloud?
Self-hosted -> Meilisearch, Typesense, Elasticsearch (more ops work)
Cloud/managed -> Algolia, Meilisearch Cloud, Pinecone (less ops work)
|
Does your budget allow ongoing SaaS costs?
YES -> Cloud options reduce operational burden
NO -> Self-hosted open-source solutions reduce costs

### Rationale

Search engine selection should match data scale, feature requirements, and operational capabilities. Starting with simpler options (database FTS) and migrating as needs grow is a proven pattern.

### Recommended Default

**Default:** Meilisearch for most self-hosted Laravel apps; Algolia for managed/enterprise.
**Reason:** Meilisearch offers the best balance of features, simplicity, and cost for typical Laravel applications.

### Risks Of Wrong Choice

- Over-engineering: dedicated engine for simple needs adds unnecessary cost
- Under-engineering: database engine for complex search degrades UX
- No vector readiness: needing to migrate architectures when AI features are needed

### Related Rules

- Start with Scout Database Engine
- Benchmark with Production Data Before Choosing
- Account for Total Cost of Ownership

### Related Skills

- Configure and Implement Search Appliance Comparison

---

## Single vs Multi-Engine Architecture

---

### Decision Context

When implementing Search Appliance Comparison, you must decide whether to use one search engine for all models or different engines for different search needs.

### Decision Criteria

* architectural
* maintainability

### Decision Tree

Do all searchable models in your application have similar requirements?
|
YES -> Single engine via SCOUT_DRIVER is the simplest approach
    |
    Does the single engine meet all feature requirements?
    YES -> Single engine is correct
    NO -> Consider a second engine for specific use cases
NO -> Use per-model engine selection via searchableUsing()
    |
    For each model, match engine to requirements:
    Primary models (products, posts) -> Feature-rich engine
    Secondary models (logs, archives) -> Simple/cheap engine
    |
    Is each engine configuration properly isolated?
    YES -> Multi-engine architecture is ready
    NO -> Separate configs, keys, and indexes per engine

### Rationale

Different models have different search needs. Products need full-text with faceting; audit logs only need basic filtering. Per-model engine selection optimizes cost and performance.

### Recommended Default

**Default:** Single engine for simplicity; multi-engine only when requirements diverge.
**Reason:** Multi-engine adds operational complexity justified only by divergent requirements.

### Risks Of Wrong Choice

- Single engine for divergent needs: paying for features some models do not need
- Multi-engine unnecessarily: operational overhead of multiple systems

### Related Rules

- Start with Scout Database Engine
- Benchmark with Production Data Before Choosing
- Account for Total Cost of Ownership

### Related Skills

- Configure and Implement Search Appliance Comparison

---

## Full-Text vs Vector vs Hybrid Search Decision

---

### Decision Context

When implementing Search Appliance Comparison, you must decide which search paradigm to adopt based on your use case.

### Decision Criteria

* accuracy
* architectural
* cost

### Decision Tree

What is the primary nature of your search queries?
|
Exact keyword matching (product names, SKUs, addresses) -> Full-text search (BM25)
Semantic/conceptual (similar products, documents about X) -> Vector search
Both -> Hybrid search (keyword + vector combined)
|
Do you have the infrastructure for embedding generation and storage?
YES -> Vector or hybrid search is feasible
NO -> Full-text search is simpler and immediately available
|
Is search latency critical?
YES -> Full-text search is fastest (no embedding generation at query time)
NO -> Vector/hybrid search with pre-computed embeddings works well

### Rationale

Full-text search excels at exact keyword matching with low latency. Vector search enables semantic understanding but requires embedding infrastructure. Hybrid search combines both at the cost of additional complexity.

### Recommended Default

**Default:** Full-text search for most applications; add vector/hybrid when semantic search is needed.
**Reason:** Full-text search provides the best performance-to-value ratio for typical web applications.

### Risks Of Wrong Choice

- Vector-only for keyword queries: missed exact-match results
- Full-text-only for semantic queries: poor recall for conceptual searches

### Related Rules

- Start with Scout Database Engine
- Benchmark with Production Data Before Choosing
- Account for Total Cost of Ownership

### Related Skills

- Configure and Implement Search Appliance Comparison

