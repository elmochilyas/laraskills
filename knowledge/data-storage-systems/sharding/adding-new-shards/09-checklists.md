# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.12 Adding new shards (rehashing, double-writing during transition)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Progressive migration applied
- [ ] Reversible cutover applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Adding multiple shards simultaneously**: Each new shard requires backfill from existing shards. Backfilling to 3 new shards simultaneously multiplies load. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] New shard added without downtime or data loss
- [ ] Data distribution returns to even within acceptable timeframe
- [ ] New shard handles its share of traffic correctly

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Progressive migration applied
- [ ] Reversible cutover applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Provision new shard infrastructure (database server, storage, network) completed
- [ ] Configure new shard connection in application config completed
- [ ] For consistent hashing: add shard to ring, redistribute 1/N of keys completed
- [ ] For virtual buckets: update bucket-to-shard mapping, move affected bucket data completed
- [ ] For directory-based: add new shard to available pool, move keys as needed completed

---

# Performance Checklist

- [ ] Performance: Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must ac...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Adding multiple shards simultaneously**: Each new shard requires backfill from existing shards. Backfilling to 3 new shards simultaneously multiplies load. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] New shard infrastructure provisioned and tested
- [ ] Data migration completes without data loss
- [ ] Data distribution is even after adding new shard
- [ ] Routing updated to include new shard
- [ ] Monitoring configured for new shard
- [ ] New shard added without downtime or data loss
- [ ] Data distribution returns to even within acceptable timeframe
- [ ] New shard handles its share of traffic correctly
- [ ] New shards added before any shard reaches critical utilization
- [ ] Growth projections accurate within ±20% over 6 months

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Choose High-Cardinality Shard Key prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] New shard not added to routing â€” never receives traffic prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Adding multiple shards simultaneously**: Each new shard requires backfill from existing shards. Backfilling to 3 new shards simultaneously multiplies load. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
