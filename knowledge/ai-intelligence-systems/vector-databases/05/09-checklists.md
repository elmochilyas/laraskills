# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Benchmark with production data size.
- [ ] Monitor query latency percentiles (p50/p95/p99).
- [ ] Plan for data growth.
- [ ] Provision enough RAM for the index.
- [ ] Separate indexing and query workloads.
- [ ] Capacity planning accounts for data growth over 6-12 months.
- [ ] Index fits in RAM (memory provisioning is adequate for index type and dataset size).
- [ ] Query cache (Redis) is implemented for frequent queries.
- [ ] Implement a Query Cache
- [ ] Monitor Query Latency Percentiles
- [ ] Plan for Data Growth
- [ ] Provision Enough RAM for the Index
- [ ] Use Dedicated Instances for Vector DB
- [ ] Capacity planning accounts for 6-12 months of data growth
- [ ] Index fits in RAM (memory provisioned 2-4x vector size for HNSW, 1.1x for IVF)
- [ ] Query cache (Redis) is implemented with appropriate TTL
- [ ] **Add replication for high availability**: Replicate shards across availability zones. Route read queries to replicas. Ensure failover works before needing it.
- [ ] **Assess memory adequacy**: Calculate raw vector size (vectorCount Ã— dimensions Ã— 4 bytes) and index overhead (HNSW: 2-4x, IVF: 1.1x, PQ: 0.3-0.5x). Confirm index fits in RAM with 20% headroom.
- [ ] **Configure caching**: Implement a query cache (Redis) for frequent queries. Cache key on normalized query text or vector hash. Set TTL based on content update frequency (60-300 seconds typical).
- [ ] Cache hit rate >20% for production query volume

---

# Architecture Checklist

- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement immediate secret management improvements
- [ ] Implement input validation and output sanitization layers
- [ ] Implement reconnection logic with last-event-id tracking
- [ ] Implement response caching with appropriate TTL and invalidation strategy
- [ ] Implement with typed tool definitions and structured output schemas

---

# Implementation Checklist

- [ ] Benchmark with production data size.
- [ ] Monitor query latency percentiles (p50/p95/p99).
- [ ] Plan for data growth.
- [ ] Provision enough RAM for the index.
- [ ] Separate indexing and query workloads.
- [ ] Use a managed service for most deployments.
- [ ] Use SSDs for disk-based vector DBs
- [ ] **Add replication for high availability**: Replicate shards across availability zones. Route read queries to replicas. Ensure failover works before needing it.
- [ ] **Assess memory adequacy**: Calculate raw vector size (vectorCount Ã— dimensions Ã— 4 bytes) and index overhead (HNSW: 2-4x, IVF: 1.1x, PQ: 0.3-0.5x). Confirm index fits in RAM with 20% headroom.
- [ ] **Configure caching**: Implement a query cache (Redis) for frequent queries. Cache key on normalized query text or vector hash. Set TTL based on content update frequency (60-300 seconds typical).
- [ ] **Implement sharding for datasets >1M vectors**: Partition the index across multiple nodes. Each shard handles a subset of vectors. Query all shards in parallel and merge results with re-ranking.
- [ ] **Optimize index parameters**: If latency exceeds targets, tune efSearch (HNSW) or nprobe (IVF) down to improve speed at acceptable recall cost. Re-benchmark after changes.

---

# Performance Checklist

- [ ] HNSW memory: 2-4x raw vector size (graph edges consume additional memory).
- [ ] IVF memory: 1.1x raw vector size (centroids only).
- [ ] PQ reduces memory by 4-8x with 1-5% recall loss.
- [ ] Query concurrency: a single node can handle 50-200 QPS depending on latency target.
- [ ] Sharding improves both capacity and QPS (search N shards in parallel, merge results).
- [ ] A single node handles 50-200 QPS depending on latency target
- [ ] Batch inserts (100-1000 vectors): 10-100x faster than single inserts
- [ ] Cache eliminates embedding (50-200ms) + ANN search (5-50ms) for repeated queries

---

# Security Checklist

- [ ] Encrypt data at rest on dedicated vector DB instances

---

# Reliability Checklist

- [ ] Assuming all vector DBs scale the same â€” each has different sharding, replication, and consistency models.
- [ ] Not monitoring index growth â€” capacity planning is reactive instead of proactive.
- [ ] Not sharding before hitting performance limits â€” performance degrades gradually, then suddenly.
- [ ] Running vector DB on the same server as the application â€” resource contention degrades both.
- [ ] Under-provisioning RAM â€” the index doesn't fit in memory, causing 10-100x slower searches.
- [ ] Using HNSW without considering memory â€” a 10M vector HNSW index can use 60GB+ RAM.

---

# Testing Checklist

- [ ] Cache hit rate >20% for production query volume
- [ ] Capacity planning accounts for 6-12 months of data growth
- [ ] Capacity planning accounts for data growth over 6-12 months.
- [ ] Index fits in RAM (memory provisioned 2-4x vector size for HNSW, 1.1x for IVF)
- [ ] Index fits in RAM (memory provisioning is adequate for index type and dataset size).
- [ ] Index fits in RAM with 20% headroom
- [ ] Monitoring alerts trigger before performance degradation impacts users
- [ ] p50 query latency <50ms
- [ ] p99 query latency <200ms at current and projected dataset size (6 months)
- [ ] Query cache (Redis) is implemented for frequent queries.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Use a managed service for most deployments.

---

# Anti-Pattern Prevention Checklist

- [ ] [Pre-Filtering Without Index â€” Full Scan on Metadata]
- [ ] [Post-Filtering â€” Zero Results After Too Many Filters]
- [ ] [Not Using Indexed Metadata Fields for Frequent Filters]
- [ ] [No Combined Filter Optimization â€” AND Filters Without Composite Index]
- [ ] [Filter Values Not Normalized â€” Case-Sensitivity Mismatches]
- [ ] Ignoring Cold Start:
- [ ] Manual Scaling:
- [ ] No Caching:
- [ ] Over-Provisioning:
- [ ] Re-index-on-Query:
- [ ] Single-Region Single-Node:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] HNSW search latency: O(log n) â€” stays fast as dataset grows

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


