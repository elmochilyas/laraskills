# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.10 Shard rebalancing: data movement, downtime vs. online migration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Online rebalance workflow applied
- [ ] Rate-limited migration applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Unbounded rebalance time**: Rebalancing 100GB over a slow network takes hours. Monitor progress, estimate completion time, communicate with stakeholders. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Data distribution within ±10% of uniform after rebalance
- [ ] Zero data loss during migration
- [ ] Application performance impact within acceptable threshold

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Online rebalance workflow applied
- [ ] Rate-limited migration applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Assess current distribution: measure data volume, throughput per shard completed
- [ ] Determine new shard layout: add shards, define new mapping completed
- [ ] For hash-based: update hash ring, move affected keys completed
- [ ] For directory-based: update shard map, move keys completed
- [ ] For range-based: split ranges, move data completed

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

- [ ] Unbounded rebalance time**: Rebalancing 100GB over a slow network takes hours. Monitor progress, estimate completion time, communicate with stakeholders. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Target distribution achieves even balance
- [ ] Data migration completes without data loss
- [ ] Read traffic switches to new shard correctly
- [ ] Rebalancing causes minimal performance impact
- [ ] Old shard data cleaned up after migration
- [ ] Data distribution within ±10% of uniform after rebalance
- [ ] Zero data loss during migration
- [ ] Application performance impact within acceptable threshold
- [ ] Virtual buckets distribute keys evenly across shards
- [ ] Rebalance moves only required proportion of data

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
- [ ] Migration causes high load on source shard (throttle migration rate) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Unbounded rebalance time**: Rebalancing 100GB over a slow network takes hours. Monitor progress, estimate completion time, communicate with stakeholders. prevented

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
