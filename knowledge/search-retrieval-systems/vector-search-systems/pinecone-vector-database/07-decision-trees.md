# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Vector Search Systems
**Knowledge Unit:** Pinecone Managed Vector Database
**Generated:** 2026-06-03

---

# Decision Inventory

1. Vector Database Selection Strategy
2. Embedding Generation Approach
3. ANN Index Type Selection (HNSW vs IVFFlat)

---

# Architecture-Level Decision Trees

## Vector Database Selection Strategy

---

### Decision Context

When implementing Pinecone Managed Vector Database, you must decide which vector database or extension to use for storing and querying embeddings.

### Decision Criteria

* architectural
* performance
* cost

### Decision Tree

Does your application already use PostgreSQL?
|
YES -> pgvector is the lowest-friction addition (no new infrastructure)
    |
    Do you need ACID compliance for vector operations?
    YES -> pgvector is the clear choice
    NO -> pgvector still recommended for PostgreSQL projects
NO -> Is the dataset expected to exceed 100M vectors?
    YES -> Consider Pinecone (managed) or Milvus (self-hosted) for scale
    NO -> Qdrant offers excellent self-hosted and cloud options
|
Do you need hybrid search (vector + keyword)?
YES -> Qdrant or pgvector (with PostgreSQL FTS) are strong choices
NO -> Any vector database will work

### Rationale

pgvector is ideal for PostgreSQL-based projects as it adds vector search without new infrastructure. For larger-scale or non-PostgreSQL projects, dedicated vector databases offer better performance at scale.

### Recommended Default

**Default:** pgvector for PostgreSQL apps; Qdrant for non-PostgreSQL or when hybrid search is needed.
**Reason:** Minimizes infrastructure complexity while providing robust vector search.

### Risks Of Wrong Choice

- Dedicated vector DB for small PostgreSQL app: unnecessary infrastructure
- pgvector at massive scale (>100M vectors): performance degradation
- No proper indexing: full scan on every query

### Related Rules

- Start with Serverless Pinecone
- Match Index Metric to Embedding Model
- Use Metadata Filtering for Structured Queries

### Related Skills

- Configure and Implement Pinecone Managed Vector Database

---

## Embedding Generation Approach

---

### Decision Context

When implementing Pinecone Managed Vector Database, you must decide how to generate vector embeddings via API service or local model.

### Decision Criteria

* cost
* performance
* latency

### Decision Tree

Is latency for embedding generation a critical concern?
|
YES -> Use local embedding models (e.g., sentence-transformers, fastembed)
    |
    Is the server's CPU/GPU sufficient for local generation?
    YES -> Local generation provides lowest latency and no API costs
    NO -> Consider API-based generation despite latency
NO -> API-based generation is acceptable
    |
    Which embedding provider aligns with your stack?
    OpenAI -> text-embedding-3-small or text-embedding-3-large
    Cohere -> embed-english-v3.0 or embed-multilingual-v3.0
    |
    Are you rate-limited by the API?
    YES -> Implement caching and queuing for embedding generation
    NO -> Direct API calls are sufficient

### Rationale

Local embedding generation eliminates API costs and latency but requires adequate compute resources. API-based generation is simpler to implement but adds per-request cost and latency.

### Recommended Default

**Default:** API-based generation (OpenAI text-embedding-3-small) for simplicity; local for cost-sensitive high-volume applications.
**Reason:** Balances implementation simplicity with operational costs.

### Risks Of Wrong Choice

- Local generation on underpowered hardware: slow indexing, request timeouts
- API generation at high volume: significant ongoing costs, rate limiting

### Related Rules

- Start with Serverless Pinecone
- Match Index Metric to Embedding Model
- Use Metadata Filtering for Structured Queries

### Related Skills

- Configure and Implement Pinecone Managed Vector Database

---

## ANN Index Type Selection (HNSW vs IVFFlat)

---

### Decision Context

When implementing Pinecone Managed Vector Database, you must choose between HNSW and IVFFlat approximate nearest neighbor indexes.

### Decision Criteria

* performance
* memory

### Decision Tree

Is query speed the primary concern?
|
YES -> Default to HNSW indexes (faster query, higher memory usage)
    |
    Can you afford the memory for HNSW graph structures?
    YES -> HNSW with m=16, ef_construction=200 is recommended
    NO -> Consider IVFFlat (less memory, slower queries)
NO -> Is build speed important (frequent re-indexing)?
    YES -> IVFFlat builds faster and requires no training data
    NO -> HNSW remains the better default
|
Is the index built on a large dataset (>1M vectors)?
YES -> Tune HNSW ef_construction or IVFFlat lists parameter
NO -> Default parameters are sufficient

### Rationale

HNSW provides better query performance at the cost of higher memory usage and slower build time. IVFFlat is faster to build and uses less memory but has slower query performance.

### Recommended Default

**Default:** HNSW indexes for most workloads; IVFFlat when memory is constrained.
**Reason:** HNSW offers the best query performance for typical search workloads.

### Risks Of Wrong Choice

- HNSW on memory-constrained systems: out-of-memory errors
- IVFFlat with too few lists: poor recall and accuracy
- No index at all: full scan on every query

### Related Rules

- Start with Serverless Pinecone
- Match Index Metric to Embedding Model
- Use Metadata Filtering for Structured Queries

### Related Skills

- Configure and Implement Pinecone Managed Vector Database

