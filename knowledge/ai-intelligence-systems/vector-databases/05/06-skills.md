# Skill: Scale Vector Database Performance

## Purpose
Optimize vector database query latency, indexing throughput, and capacity for growing datasets by provisioning adequate RAM, using dedicated instances, sharding, caching, and monitoring performance percentiles.

## When To Use
- Production deployments with >100K vectors requiring consistent sub-50ms latency
- Growing datasets expected to exceed current capacity within 6-12 months
- Current search latency is above acceptable thresholds (p99 >200ms)
- Preparing for or responding to increased query throughput (QPS)

## When NOT To Use
- Datasets under 10K vectors where brute force search is fast enough
- Development environments where performance isn't critical
- Systems being replaced before hitting scale limits

## Prerequisites
- KU-01 (Vector Database Fundamentals) — understanding of collections, vectors, indexing
- KU-02 (Indexing Strategies) — index type selection for performance
- KU-03 (Query Patterns & Filtering) — query performance optimization
- Performance monitoring (latency percentiles, QPS, memory usage, CPU)
- Access to production data size and growth projections

## Inputs
- Current dataset size (vector count, dimensions) and growth rate (monthly)
- Current index type and parameters
- Current latency percentiles (p50, p95, p99) and QPS
- Available infrastructure budget (RAM, nodes, cloud vs. self-hosted)
- Latency and throughput SLAs
- Query patterns (frequency distribution, filter selectivity, cache hit rate)

## Workflow
1. **Profile current performance**: Measure current p50/p95/p99 query latency, QPS, memory usage, CPU, and cache hit rate. Identify bottlenecks (RAM pressure, CPU saturation, disk I/O, network).
2. **Assess memory adequacy**: Calculate raw vector size (vectorCount × dimensions × 4 bytes) and index overhead (HNSW: 2-4x, IVF: 1.1x, PQ: 0.3-0.5x). Confirm index fits in RAM with 20% headroom.
3. **Provision dedicated instances**: Move the vector database to dedicated instances (not shared with the application server). Allocate enough RAM for the index with growth margin. Use SSDs for disk-based vector DBs.
4. **Configure caching**: Implement a query cache (Redis) for frequent queries. Cache key on normalized query text or vector hash. Set TTL based on content update frequency (60-300 seconds typical).
5. **Optimize index parameters**: If latency exceeds targets, tune efSearch (HNSW) or nprobe (IVF) down to improve speed at acceptable recall cost. Re-benchmark after changes.
6. **Implement sharding for datasets >1M vectors**: Partition the index across multiple nodes. Each shard handles a subset of vectors. Query all shards in parallel and merge results with re-ranking.
7. **Add replication for high availability**: Replicate shards across availability zones. Route read queries to replicas. Ensure failover works before needing it.
8. **Set up monitoring and alerting**: Track p50/p95/p99 latency, QPS, cache hit rate, memory usage, and CPU. Set alerts for p99 >200ms, cache hit rate <10%, memory >80% of provisioned.
9. **Plan for growth**: Use growth projections (monthly vector additions) to plan capacity 6-12 months ahead. Schedule node additions before performance degrades.
10. **Review and iterate**: Monthly performance review. Compare actual vs. projected growth. Adjust index parameters, caching strategy, and node count as needed.

## Validation Checklist
- [ ] Index fits in RAM (memory provisioned 2-4x vector size for HNSW, 1.1x for IVF)
- [ ] Vector DB runs on dedicated instances (not shared with application)
- [ ] Query cache (Redis) is implemented with appropriate TTL
- [ ] Query latency p50 <50ms and p99 <200ms at current dataset size
- [ ] Sharding is configured for datasets >1M vectors
- [ ] Capacity planning accounts for 6-12 months of data growth
- [ ] Query latency percentiles and QPS are monitored with alerts for degradation

## Common Failures
- **Index not fitting in RAM**: p99 latency jumps from 20ms to 500ms+ as the index hits disk. Solution: reduce index type overhead (switch to IVF+PQ), add RAM, or shard across more nodes.
- **Resource contention**: Vector DB and web app on the same server, both competing for RAM and CPU. Solution: separate onto dedicated instances or use resource limits (Docker/cgroups).
- **Cache miss storm after deployment**: Cache emptied by deployment, all queries hit vector DB simultaneously. Solution: gradual cache warm-up or pre-warm critical queries.
- **Shard imbalance**: Some shards hold more vectors than others, causing uneven query load. Solution: use consistent hashing or re-balance shards periodically.

## Decision Points
- **Scale up (vertical) vs. scale out (horizontal)**: Scale up (more RAM/CPU on single node) up to 64GB RAM. Beyond that, scale out (shard across nodes) for linear QPS scaling and HA.
- **HNSW vs. IVF+PQ at scale**: At 10M+ vectors, HNSW memory requirements (24GB+ for 1536-dim) may exceed budget. Switch to IVF+PQ for 4-8x memory reduction at 1-5% recall loss.
- **Caching granularity**: Cache exact query+filter combinations for highest hit rate. Cache normalized/semantic queries for broader coverage but lower precision.

## Performance Considerations
- HNSW search latency: O(log n) — stays fast as dataset grows
- IVF search latency: O(sqrt(n) × nprobe/centroids) — degrades more gracefully
- Cache eliminates embedding (50-200ms) + ANN search (5-50ms) for repeated queries
- A single node handles 50-200 QPS depending on latency target
- Sharding N nodes provides Nx QPS improvement (parallel search, merge results)
- SSDs vs. HDDs: 10-100x latency difference for index reads
- Batch inserts (100-1000 vectors): 10-100x faster than single inserts

## Security Considerations
- Dedicated instances reduce attack surface (no application code on DB server)
- Query caching must respect data access controls — don't serve cached results across tenants
- Encrypt data at rest on dedicated vector DB instances
- Network isolation between application and vector DB tiers

## Related Rules
- Provision Enough RAM for the Index
- Use Dedicated Instances for Vector DB
- Implement a Query Cache
- Monitor Query Latency Percentiles
- Plan for Data Growth

## Related Skills
- Skill: Configure and Tune Vector Database Indexes (ku-02)
- Skill: Implement Vector Search with Filtering (ku-03)
- Skill: Synchronize Vector Database with Source Document Store (ku-04)
- Skill: Choose and Migrate Between Vector Database Providers (ku-06)

## Success Criteria
- p99 query latency <200ms at current and projected dataset size (6 months)
- p50 query latency <50ms
- Cache hit rate >20% for production query volume
- Vector DB runs on dedicated instances with no resource contention
- Index fits in RAM with 20% headroom
- Sharding (if needed) provides linear QPS improvement
- Monitoring alerts trigger before performance degradation impacts users