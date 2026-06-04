# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** ku-06
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Abstract provider-specific code.
- [ ] Consider total cost of ownership (TCO).
- [ ] Evaluate with your data and queries.
- [ ] Plan for data export.
- [ ] Test migration before committing.
- [ ] Data export format is standard (JSONL, Parquet) for portability.
- [ ] Dual-write pattern is implemented for zero-downtime migration.
- [ ] Migration process is documented and tested (not just planned).
- [ ] Abstract Provider-Specific Code Behind an Interface
- [ ] Don't Dismiss pgvector Prematurely
- [ ] Evaluate Providers with Your Data
- [ ] Plan a Tested Rollback Procedure
- [ ] Track Embedding Model Version
- [ ] Data export format is standard (JSONL, Parquet) for portability
- [ ] Dual-write pattern is implemented for zero-downtime migration
- [ ] Migration process is documented and tested with a dry run on non-production data
- [ ] **Build candidate shortlist**: Based on requirements, select 2-4 candidate providers. Include pgvector as a baseline (runs inside PostgreSQL). Consider: pgvector, Qdrant (self-hosted or cloud), Pinecone (managed), Milvus (self-hosted).
- [ ] **Bulk import**: Use the new provider's bulk import API to load exported vectors. Transform dimensions or metadata format if needed. Validate import completeness.
- [ ] **Cutover reads**: Switch read queries to the new provider while maintaining dual-write. Monitor for issues during a burn-in period (24-72 hours).
- [ ] Dual-write runs without errors during observation period

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Abstract provider-specific code.
- [ ] Consider total cost of ownership (TCO).
- [ ] Evaluate with your data and queries.
- [ ] Plan for data export.
- [ ] Test migration before committing.
- [ ] Use feature comparison matrix.
- [ ] **Build candidate shortlist**: Based on requirements, select 2-4 candidate providers. Include pgvector as a baseline (runs inside PostgreSQL). Consider: pgvector, Qdrant (self-hosted or cloud), Pinecone (managed), Milvus (self-hosted).
- [ ] **Bulk import**: Use the new provider's bulk import API to load exported vectors. Transform dimensions or metadata format if needed. Validate import completeness.
- [ ] **Cutover reads**: Switch read queries to the new provider while maintaining dual-write. Monitor for issues during a burn-in period (24-72 hours).
- [ ] **Decommission old provider**: After burn-in period confirms stability, stop writes to the old provider. Retain old provider data for 30 days as backup before decommissioning.
- [ ] **Define requirements**: Document latency targets, QPS, budget, feature requirements (hybrid search, multi-vector, geo-filtering), hosting preference (managed vs. self-hosted), and compliance needs.
- [ ] **Evaluate with your data**: Benchmark each provider using your actual vector dimensions, dataset size (or scaled test), and query patterns. Measure p50/p95 latency, QPS, recall@10, and cost at projected scale.

---

# Performance Checklist

- [ ] Dual-write overhead: each write operation latency increases by ~10-50ms for the secondary write

---

# Security Checklist

- [ ] Access control propagation:
- [ ] Credential management:
- [ ] Data export security:
- [ ] Data residency during migration:
- [ ] Migration downtime:
- [ ] Rollback plan:
- [ ] Encrypt vector export files â€” embeddings can be partially reversed to reveal information
- [ ] Export speed: 10K-100K vectors/minute from most providers (depends on API rate limits)

---

# Reliability Checklist

- [ ] Budgeting only for vector DB costs â€” also account for embedding costs (re-embedding data during migration).
- [ ] Choosing a provider based on benchmarks alone â€” real-world performance depends on specific use case.
- [ ] Ignoring consistency guarantees â€” Pinecone's eventual consistency may not suit applications needing immediate read-after-write.
- [ ] Not abstracting the provider interface â€” switching providers requires rewriting application code.
- [ ] Not testing the migration process â€” the first migration attempt should never be in production.
- [ ] Underestimating migration complexity â€” exporting millions of vectors, transforming formats, and re-indexing takes days.

---

# Testing Checklist

- [ ] Data export format is standard (JSONL, Parquet) for portability
- [ ] Data export format is standard (JSONL, Parquet) for portability.
- [ ] Dual-write pattern is implemented for zero-downtime migration
- [ ] Dual-write pattern is implemented for zero-downtime migration.
- [ ] Dual-write runs without errors during observation period
- [ ] Migration completes with zero application downtime
- [ ] Migration process is documented and tested (not just planned).
- [ ] Migration process is documented and tested with a dry run on non-production data
- [ ] New provider meets all latency, recall, and cost targets at projected scale
- [ ] Old provider data retained for 30 days post-migration as backup

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Abstract provider-specific code.

---

# Anti-Pattern Prevention Checklist

- [ ] [No Embedding Cache â€” Regenerating for Every Query]
- [ ] [Cache Key Not Including Embedding Model Version]
- [ ] [Cache TTL Too Short â€” Frequent Cache Misses]
- [ ] [Cache Without Fallback â€” Cache Miss = Failed Query]
- [ ] [In-Memory Cache for Large Embedding Cache â€” Memory Overflow]
- [ ] Feature Incompatibility Discovery:
- [ ] Ignoring pgvector:
- [ ] Migration Without Dual-Write:
- [ ] No Rollback Plan:
- [ ] Perpetual Evaluation:
- [ ] Provider Lock-In Scofflaw:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Audit log all migration operations
- [ ] Implement rollback plan that restores service quickly if migration fails

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


