# Decomposition: Performance & Scaling

## Topic Overview

Performance and scaling for vector databases covers optimizing query latency, indexing throughput, memory usage, and capacity for growing datasets. As the vector collection grows from thousands to millions of vectors, search latency and memory requirements scale non-linearly. Performance optimization involves index tuning, hardware provisioning, sharding, caching, and choosing between self-hosted and managed vector database services.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-05/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Performance & Scaling
- **Purpose:** Performance and scaling for vector databases covers optimizing query latency, indexing throughput, memory usage, and capacity for growing datasets. As the vector collection grows from thousands to millions of vectors, search latency and memory requirements scale non-linearly. Performance optimization involves index tuning, hardware provisioning, sharding, caching, and choosing between self-hosted and managed vector database services.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-03, ku-01, ku-05

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-03
- ku-01
- ku-05

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Query Latency:** The time between sending a query and receiving results. Target: <50ms for user-facing search, <200ms for RAG pipelines.
- **Indexing Throughput:** The rate at which vectors can be inserted into the index. Critical for batch backfills and real-time sync.
- **Memory Hierarchy:** Vector data may live in RAM (fastest), SSD (memory-mapped), or HDD (slowest). ANN indexes perform best in RAM.
- **Sharding:** Partitioning a large vector index across multiple nodes. Each shard handles a subset of vectors.
- **Replication:** Copying shards across nodes for high availability and read throughput.
- **Distributed Search:** Querying across multiple shards and merging results. Adds latency proportional to the number of shards.
- **Query Concurrency:** The number of simultaneous queries the vector DB can handle. Scales with CPU cores and available RAM.
- **Cache Hit Rate:** Results from the query cache (identical or similar queries) served in <1ms instead of 5-50ms.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

