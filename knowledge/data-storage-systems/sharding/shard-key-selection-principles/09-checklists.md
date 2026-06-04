# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.1 Shard key selection principles (high cardinality, even distribution, query alignment)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] user_id or tenant_id applied
- [ ] Composite shard key applied
- [ ] Avoid date-only shard key applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Changing shard key after production**: Shard key change requires full data re-shard. Pick carefully; changes are extremely expensive. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Shard key is used in > 90% of queries
- [ ] Data distribution across shards is within ±10% of uniform
- [ ] Zero hot shards under normal workload

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] user_id or tenant_id applied
- [ ] Composite shard key applied
- [ ] Avoid date-only shard key applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] List all frequent query patterns and their WHERE clauses completed
- [ ] Evaluate candidate shard keys against criteria: completed
- [ ] Prefer `user_id` or `tenant_id` for most SaaS applications completed
- [ ] Consider composite keys: `(tenant_id, user_id)` for multi-tenant sharding completed
- [ ] Avoid: date-only keys (hot shard), status fields (low cardinality), nullable columns completed

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

- [ ] Changing shard key after production**: Shard key change requires full data re-shard. Pick carefully; changes are extremely expensive. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Shard key has high cardinality (> 1M unique values)
- [ ] Most frequent queries include the shard key
- [ ] Data distributes evenly across shards (simulate with existing data)
- [ ] Hot shard avoidance confirmed with write pattern analysis
- [ ] Candidate keys evaluated against real query patterns
- [ ] Shard key is used in > 90% of queries
- [ ] Data distribution across shards is within ±10% of uniform
- [ ] Zero hot shards under normal workload
- [ ] Shard key candidate validated with real data
- [ ] Coverage > 90% and distribution within ±10%

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
- [ ] Date-only shard key: all writes go to current month's shard prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Changing shard key after production**: Shard key change requires full data re-shard. Pick carefully; changes are extremely expensive. prevented

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
