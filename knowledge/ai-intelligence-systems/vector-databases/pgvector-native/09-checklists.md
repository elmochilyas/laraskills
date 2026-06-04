# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** pgvector-native
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Hybrid search single query
- [ ] Index after data load
- [ ] Inline vector column
- [ ] Migration-first
- [ ] One less database
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Build HNSW Index After Bulk Data Load
- [ ] Install the Vector Extension Before Migrations
- [ ] Specify Embedding Dimensions in Migration
- [ ] ef_search configurable per query pattern
- [ ] HNSW index created with appropriate m and ef_construction
- [ ] pgvector extension installed before migrations run
- [ ] ef_search tunable per query for latency/recall tradeoff
- [ ] HNSW index provides sub-10ms search at target dataset size
- [ ] Migration includes extension installation check

---

# Architecture Checklist

- [ ] Inline vs. separate table â†’ Inline vector column in document/chunk table. Reason: Enables scoped queries, hybrid search, and ACID without joins
- [ ] Native Laravel support vs. DBAL/raw SQL â†’ Laravel 13 adds native migration types and query builder support. Reason: No raw SQL needed for 95% of use cases
- [ ] pgvector as default vs. abstract vector store â†’ pgvector is the production default. Reason: Covers 95% of Laravel RAG workloads on existing infrastructure
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Hybrid search single query
- [ ] Index after data load
- [ ] Inline vector column
- [ ] Migration-first
- [ ] One less database
- [ ] PostgreSQL + AI = pgvector
- [ ] Scoped vector search
- [ ] Build HNSW Index After Bulk Data Load
- [ ] Install the Vector Extension Before Migrations
- [ ] Specify Embedding Dimensions in Migration
- [ ] Distance metric
- [ ] HNSW vs IVFFlat

---

# Performance Checklist

- [ ] `ef_search` tuning: increase for recall, decrease for speed (range: 1-1000, default: 40)
- [ ] Dimension impact: higher dimensions (3076d) = slower search, more storage
- [ ] HNSW index: sub-10ms p99 for 1M vectors (ef_search=40)
- [ ] Index build time: 1M vectors Ã— 1536d â†’ HNSW ~1-2 hours, IVFFlat ~10 minutes
- [ ] IVFFlat: faster build, slower query â€” build time ~minutes vs. HNSW hours
- [ ] Query time: HNSW ~10ms, IVFFlat ~50ms (at 1M, properly tuned)
- [ ] Index memory: ~1.2GB per million vectors (1536d)
- [ ] Monitor query latency anomalies (potential data extraction)

---

# Security Checklist

- [ ] Backup strategy: standard PostgreSQL backup includes vector data
- [ ] Build index after data load, not during ingestion
- [ ] Consider partitioning for tables exceeding 50M vectors
- [ ] Install pgvector extension on PostgreSQL server â€” requires superuser or extension privileges
- [ ] Monitor index build progress on large datasets
- [ ] Run `CREATE EXTENSION vector` before migrations
- [ ] Set `hnsw.ef_search` per query for latency/recall tradeoff
- [ ] Upgrade path: pgvector versions track PostgreSQL major releases

---

# Reliability Checklist

- [ ] Building HNSW index on empty table â€” index build is wasted, rebuild after data load
- [ ] Forgetting to install the `vector` extension before migrations â€” migration fails
- [ ] Mixing vectors from different embedding models in same column â€” dimension mismatch or semantic mismatch
- [ ] Not specifying dimensions in migration â€” different embedding models have different dimensions
- [ ] Running `whereVectorSimilarTo` without HNSW index â€” sequential scan on large tables
- [ ] Using default `ef_search` for high-recall requirements â€” increase `ef_search` for production recall needs

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] ef_search configurable per query pattern
- [ ] ef_search tunable per query for latency/recall tradeoff
- [ ] HNSW index created with appropriate m and ef_construction
- [ ] HNSW index provides sub-10ms search at target dataset size
- [ ] Migration includes extension installation check
- [ ] Performance implications are accounted for in the design.
- [ ] pgvector extension installed before migrations run

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No HNSW Index â€” Full Scan on Every Query]
- [ ] [Creating Index After Inserting All Data â€” Hours-Long Build]
- [ ] [Not Tuning Index Build Parameters (ef_construction, M)]
- [ ] [Using Default Cosine Similarity When Inner Product Is Faster]
- [ ] [No Separate Vector Column for Each Embedding Model]
- [ ] Extension not installed
- [ ] HNSW index build failure
- [ ] Out-of-memory queries
- [ ] pgvector version mismatch
- [ ] Replication lag

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor query latency anomalies (potential data extraction)
- [ ] Query time: O(log n) â€” scales well to 10M+ vectors

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


