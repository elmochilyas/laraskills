# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.21 Time-based sharding (partition by time period, natural data lifecycle)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Time + hash hybrid applied
- [ ] Pre-creation of future shards applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Single shard per month for write-heavy workloads**: Current month's shard handles 100% of writes. If write volume is high, add hash-based sub-sharding. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Time-range queries within one shard hit exactly one shard
- [ ] Pre-created shards are available before needed
- [ ] Retention drops are clean and on schedule

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Time + hash hybrid applied
- [ ] Pre-creation of future shards applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Choose time interval: daily (365 shards/year), monthly (12/year), quarterly (4/year) completed
- [ ] Define shard naming convention: `shard_orders_2024_01` (year_month) completed
- [ ] On write, determine shard based on `created_at` or event timestamp completed
- [ ] Create shard proactively: pre-create future shards (e.g., next 6 months) completed
- [ ] Query routing: determine which shards to query based on query time range completed

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

- [ ] Single shard per month for write-heavy workloads**: Current month's shard handles 100% of writes. If write volume is high, add hash-based sub-sharding. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Data routes to correct time-based shard
- [ ] Range queries within one interval hit one shard
- [ ] Pre-created shards available before needed
- [ ] Retention policy drops old shards correctly
- [ ] Composite routing correct for both time and hash
- [ ] Time-range queries within one shard hit exactly one shard
- [ ] Pre-created shards are available before needed
- [ ] Retention drops are clean and on schedule
- [ ] Hot latest shard is monitored and mitigated if needed
- [ ] Point queries with time + user_id hit exactly one shard

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
- [ ] Hot latest shard: all writes go to current time shard prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Single shard per month for write-heavy workloads**: Current month's shard handles 100% of writes. If write volume is high, add hash-based sub-sharding. prevented

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
