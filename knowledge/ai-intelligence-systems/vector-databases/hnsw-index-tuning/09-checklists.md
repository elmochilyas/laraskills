# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** hnsw-index-tuning
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dynamic `ef_search`
- [ ] Memory budget tuning
- [ ] Memory vs. speed vs. accuracy
- [ ] Monitor recall
- [ ] Rebuild for bulk operations
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Increase maintenance_work_mem for Index Builds
- [ ] Monitor Recall with Brute-Force Comparison
- [ ] Tune ef_search Per-Query Based on Latency Budget
- [ ] ef_search configurable per query (not global fixed value)
- [ ] ef_search values documented with recall/latency tradeoffs
- [ ] HNSW index created with appropriate m (default 16)
- [ ] ef_search values are tuned per query pattern (not one-size-fits-all)
- [ ] Index fits within available memory with 20% headroom
- [ ] Index rebuild time is understood and planned for model changes

---

# Architecture Checklist

- [ ] Build
- [ ] HNSW vs. IVFFlat â†’ HNSW for production (better recall, faster query). IVFFlat for prototyping or when index build time is critical (schedule
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Dynamic `ef_search`
- [ ] Memory budget tuning
- [ ] Memory vs. speed vs. accuracy
- [ ] Monitor recall
- [ ] Rebuild for bulk operations
- [ ] Tune for workload
- [ ] Tuning knobs on a search engine
- [ ] Increase maintenance_work_mem for Index Builds
- [ ] Monitor Recall with Brute-Force Comparison
- [ ] Tune ef_search Per-Query Based on Latency Budget
- [ ] ef_construction (build quality)
- [ ] ef_search (query beam width)

---

# Performance Checklist

- [ ] `ef_search=100`: ~25ms query + ~99% recall
- [ ] `ef_search=40` (default): ~10ms query + ~95% recall @ 1M vectors 1536d
- [ ] `ef_search=400`: ~100ms query + ~99.9% recall
- [ ] Each 0.1% recall improvement costs ~2x query latency near the ceiling
- [ ] Index build: 1M vectors Ã— 1536d = ~2 hours with `ef_construction=64`
- [ ] Memory: 1M vectors Ã— 1536d Ã— m=16 â‰ˆ ~12GB for index alone (not including vector data)
- [ ] HNSW memory: ~1.2GB per million vectors (1536d, float32)
- [ ] Monitor query latency anomalies (potential extraction attempts)

---

# Security Checklist

- [ ] Build HNSW index with `ONLINE` option (pgvector 0.7+) to allow concurrent reads
- [ ] Monitor index build progress via `pg_stat_progress_create_index`
- [ ] Rebuild index if recall degrades over time (vector distribution shifts)
- [ ] Set `maintenance_work_mem` high (1-4GB) during index build â€” speeds up significantly
- [ ] Test recall with representative query set before deploying index changes
- [ ] Use `ALTER INDEX ... SET (ef_search = N)` for instance-level default

---

# Reliability Checklist

- [ ] Building HNSW index on table with existing data without increasing `maintenance_work_mem` â€” slow build
- [ ] Not testing recall â€” tuned blindly without measurement
- [ ] Rebuilding index on every deployment â€” wasted compute; rebuild only when vectors change
- [ ] Setting `ef_search` globally too high â€” unnecessary latency for simple queries
- [ ] Using default `m=16` for high-dimension vectors (3076d) â€” increase to 32-48 for better recall
- [ ] Using HNSW for <10K vectors â€” brute-force is faster and simpler below this threshold

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] ef_search configurable per query (not global fixed value)
- [ ] ef_search values are tuned per query pattern (not one-size-fits-all)
- [ ] ef_search values documented with recall/latency tradeoffs
- [ ] HNSW index created with appropriate m (default 16)
- [ ] Index fits within available memory with 20% headroom
- [ ] Index memory usage within available RAM with headroom
- [ ] Index rebuild time is understood and planned for model changes

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Default HNSW Parameters for All Workloads]
- [ ] [High efConstruction With Small Dataset â€” Unnecessary Build Cost]
- [ ] [Low ef At Query Time â€” Poor Recall]
- [ ] [High M Value Causing Memory Issues]
- [ ] [No ef Tuning Based on Recall Requirements]
- [ ] Corruption
- [ ] Index build OOM
- [ ] Memory pressure
- [ ] Query timeout with high `ef_search`
- [ ] Recall cliff

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor query latency anomalies (potential extraction attempts)
- [ ] Query time: O(log n) per search â€” scales well to 10M+ vectors

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


