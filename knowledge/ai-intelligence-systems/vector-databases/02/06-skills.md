# Skill: Configure and Tune Vector Database Indexes

## Purpose
Configure optimal ANN indexes (HNSW, IVF, PQ) for vector search workloads by selecting the right index type, tuning parameters against real data, and scheduling periodic index rebuilds to maintain recall quality.

## When To Use
- Setting up a new vector database collection for production
- Search latency or recall is below acceptable thresholds
- Dataset has grown significantly since initial index configuration
- Migrating between vector database providers with different index capabilities

## When NOT To Use
- Datasets under 1,000 vectors where brute force search is fast enough
- Prototypes where index tuning adds unnecessary complexity
- Read-only static datasets that already meet performance targets

## Prerequisites
- KU-01 (Vector Database Fundamentals) — understanding of collections, vectors, and search
- Access to a representative dataset and query set for benchmarking
- Knowledge of the target vector database's index capabilities
- Performance monitoring in place (latency percentiles, recall metrics)

## Inputs
- Dataset size (number of vectors, dimensions)
- Workload characteristics (insert frequency, query patterns, latency targets)
- Available memory and compute resources
- Current index type and parameters (if re-tuning)
- Benchmark test suite (representative queries with ground truth)

## Workflow
1. **Assess workload requirements**: Determine latency target (p99 <50ms for user-facing, <200ms for RAG), recall target (>95% recall@10), insert throughput, and available RAM.
2. **Select index type**: Choose HNSW for most production workloads (balanced speed/recall), IVF for large-scale batch search with lower memory, or IVF+PQ for memory-constrained environments. Default to HNSW unless specific constraints apply.
3. **Set initial parameters**: For HNSW, start with M=16, efConstruction=200, efSearch=50. For IVF, start with nlist=4*sqrt(n), nprobe=10.
4. **Build benchmark suite**: Create a test set of 100-1000 queries with known nearest neighbors (ground truth) from your actual data distribution.
5. **Run benchmark across configurations**: Test 3-5 parameter combinations (vary M: 8/16/32, efConstruction: 100/200/400 for HNSW) and record latency, recall@10, and memory usage.
6. **Select optimal configuration**: Choose the configuration that meets recall targets with the lowest latency. If recall is insufficient, increase parameters and re-benchmark.
7. **Deploy to production**: Apply the selected index configuration, provisioning enough RAM (2-4x vector size for HNSW) on dedicated instances.
8. **Schedule index maintenance**: Set up periodic index optimization or rebuilds. Weekly for high-throughput systems, monthly for low-churn. For static datasets, no rebuild needed.
9. **Monitor index quality**: Track recall@10, p50/p95/p99 latency, and memory pressure. Set alerts for degradation exceeding 10% from baseline.

## Validation Checklist
- [ ] Index type matches workload (HNSW for real-time inserts, IVF for batch, PQ for memory-constrained)
- [ ] Index parameters are tuned against real data, not defaults
- [ ] RAM provisioning accounts for index overhead (2-4x vector size for HNSW)
- [ ] Index rebuild or optimization is scheduled appropriate to insert volume
- [ ] Separate indexes exist for different content types with different vector distributions
- [ ] Benchmark results are documented with latency and recall metrics

## Common Failures
- **OOM crashes**: HNSW with M=32 on a 1M vector dataset can exceed available RAM. Re-benchmark with lower M or switch to IVF+PQ.
- **Silent recall degradation**: Index quality drops 5-20% over time without rebuilds. Check sync state and rebuild schedule.
- **Slow search after inserts**: If search latency doubles after bulk inserts without rebuild, schedule an index optimization.
- **Wrong index for workload**: Using IVF for real-time inserts (requires periodic offline rebuilds) when HNSW supports incremental inserts.

## Decision Points
- **HNSW vs. IVF**: Choose HNSW unless RAM is insufficient (<2x vector size) or dataset exceeds 10M vectors. IVF requires offline rebuilds.
- **Higher recall vs. lower latency**: Increase efSearch (HNSW) or nprobe (IVF) for better recall at the cost of latency. Increase by 2x, measure, iterate.
- **Single index vs. per-content-type indexes**: If documents, images, and code have different vector distributions, create separate indexes per content type rather than a single shared index.

## Performance Considerations
- HNSW build time: O(n log n) — a 1M vector index builds in 1-10 minutes
- HNSW search latency: O(log n) — stays fast as dataset grows
- IVF search latency: O(sqrt(n) × nprobe/centroids) — degrades more gracefully than brute force
- RAM: HNSW 2-4x, IVF 1.1x, PQ 0.3-0.5x of raw vector size
- Batch inserts (100-1000 vectors) are 10-100x faster than single inserts

## Security Considerations
- Index configuration does not expose sensitive data, but index rebuild timing could be used for side-channel attacks
- Monitor index operations for unauthorized creation or deletion of indexes
- Ensure index configuration changes are reviewed (like any infrastructure change)

## Related Rules
- Start with HNSW for Production Search
- Tune Index Parameters for Your Data
- Rebuild Indexes Periodically
- Choose Index Type Based on Workload
- Benchmark Index Configurations Before Production

## Related Skills
- Skill: Set Up and Query a Vector Database (ku-01)
- Skill: Implement Vector Search with Filtering (ku-03)
- Skill: Scale Vector Database Performance (ku-05)

## Success Criteria
- p99 search latency meets target (<50ms user-facing, <200ms RAG) at current dataset size
- recall@10 >95% measured against ground truth
- Index rebuilds complete within scheduled window without impacting query availability
- No OOM or swap thrashing from index memory usage
- Alert fires if recall drops below threshold