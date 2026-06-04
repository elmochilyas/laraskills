# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Benchmark recall@10 with your data.
- [ ] Consider memory constraints.
- [ ] Rebuild indexes periodically.
- [ ] Start with HNSW.
- [ ] Tune efConstruction and M.
- [ ] ANN index is created (HNSW, IVF, or PQ) â€” not brute force.
- [ ] Index is rebuilt or optimized periodically (schedule based on insert volume).
- [ ] Index parameters are tuned for the specific workload (efConstruction, M, efSearch for HNSW).
- [ ] Benchmark Index Configurations Before Production
- [ ] Choose Index Type Based on Workload
- [ ] Rebuild Indexes Periodically
- [ ] Start with HNSW for Production Search
- [ ] Tune Index Parameters for Your Data
- [ ] Benchmark results are documented with latency and recall metrics
- [ ] Index parameters are tuned against real data, not defaults
- [ ] Index rebuild or optimization is scheduled appropriate to insert volume
- [ ] **Assess workload requirements**: Determine latency target (p99 <50ms for user-facing, <200ms for RAG), recall target (>95% recall@10), insert throughput, and available RAM.
- [ ] **Build benchmark suite**: Create a test set of 100-1000 queries with known nearest neighbors (ground truth) from your actual data distribution.
- [ ] **Deploy to production**: Apply the selected index configuration, provisioning enough RAM (2-4x vector size for HNSW) on dedicated instances.
- [ ] Alert fires if recall drops below threshold

---

# Architecture Checklist

- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement graceful degradation with fallback content
- [ ] Implement immediate secret management improvements
- [ ] Implement input validation and output sanitization layers
- [ ] Implement response caching with appropriate TTL and invalidation strategy
- [ ] Implement retry with exponential backoff and jitter

---

# Implementation Checklist

- [ ] Benchmark recall@10 with your data.
- [ ] Consider memory constraints.
- [ ] Rebuild indexes periodically.
- [ ] Start with HNSW.
- [ ] Tune efConstruction and M.
- [ ] Use separate indexes for different content types.
- [ ] **Assess workload requirements**: Determine latency target (p99 <50ms for user-facing, <200ms for RAG), recall target (>95% recall@10), insert throughput, and available RAM.
- [ ] **Build benchmark suite**: Create a test set of 100-1000 queries with known nearest neighbors (ground truth) from your actual data distribution.
- [ ] **Deploy to production**: Apply the selected index configuration, provisioning enough RAM (2-4x vector size for HNSW) on dedicated instances.
- [ ] **Monitor index quality**: Track recall@10, p50/p95/p99 latency, and memory pressure. Set alerts for degradation exceeding 10% from baseline.
- [ ] **Run benchmark across configurations**: Test 3-5 parameter combinations (vary M: 8/16/32, efConstruction: 100/200/400 for HNSW) and record latency, recall@10, and memory usage.
- [ ] **Schedule index maintenance**: Set up periodic index optimization or rebuilds. Weekly for high-throughput systems, monthly for low-churn. For static datasets, no rebuild needed.

---

# Performance Checklist

- [ ] Batch inserts: inserting vectors in batches (100-1000) is 10-100x faster than single inserts.
- [ ] HNSW search latency: O(log n) â€” stays fast as the dataset grows.
- [ ] IVF search latency: O(sqrt(n) Ã— nprobe/centroids) â€” degrades more gracefully than brute force.
- [ ] PQ compression: 4-8x memory reduction with 1-5% recall loss.
- [ ] Batch inserts (100-1000 vectors) are 10-100x faster than single inserts
- [ ] HNSW search latency: O(log n) â€” stays fast as dataset grows
- [ ] IVF search latency: O(sqrt(n) Ã— nprobe/centroids) â€” degrades more gracefully than brute force

---

# Security Checklist

- [ ] Monitor index operations for unauthorized creation or deletion of indexes

---

# Reliability Checklist

- [ ] Ignoring memory requirements â€” HNSW with M=32 can use 8x the vector size in RAM.
- [ ] Not creating any index â€” defaults to brute force search, which is unusable for datasets over 10K vectors.
- [ ] Not rebuilding indexes after significant inserts â€” recall degrades by 5-20% over time.
- [ ] Using a single index for diverse content types â€” different distributions may need different index configurations.
- [ ] Using default index parameters without tuning â€” HNSW defaults may be too slow or too memory-intensive.
- [ ] Using IVF for real-time inserts â€” IVF requires periodic index rebuilds (offline).

---

# Testing Checklist

- [ ] Alert fires if recall drops below threshold
- [ ] ANN index is created (HNSW, IVF, or PQ) â€” not brute force.
- [ ] Benchmark results are documented with latency and recall metrics
- [ ] Index is rebuilt or optimized periodically (schedule based on insert volume).
- [ ] Index parameters are tuned against real data, not defaults
- [ ] Index parameters are tuned for the specific workload (efConstruction, M, efSearch for HNSW).
- [ ] Index quality (recall@10) is monitored in production.
- [ ] Index rebuild or optimization is scheduled appropriate to insert volume
- [ ] Index rebuilds complete within scheduled window without impacting query availability
- [ ] Index type matches the workload (HNSW for real-time, IVF for batch).

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Same ef for All Queries â€” No Dynamic Adjustment]
- [ ] [Top-K Too Large for Query Type]
- [ ] [No Query Batching â€” N Independent Query Calls]
- [ ] [Vector Search Without Cache for Repeated Queries]
- [ ] [No Query Timeout â€” Hanging Queries Block Workers]
- [ ] Ignoring Insert Performance:
- [ ] Index-and-Forget:
- [ ] Maximum Parameters:
- [ ] No Benchmarking:
- [ ] One Index for All:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] HNSW build time: O(n log n) â€” a 1M vector index builds in 1-10 minutes
- [ ] HNSW search latency: O(log n) â€” stays fast as dataset grows
- [ ] Monitor index operations for unauthorized creation or deletion of indexes

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


