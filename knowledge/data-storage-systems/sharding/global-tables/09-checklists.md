# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.25 Global tables (replicated to all shards for JOIN support)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read from local shard, write to central applied
- [ ] Cache-as-global-table applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Treating large tables as global**: Tables with millions of rows should not be global. Replicating 10M rows to 16 shards wastes 160M rows of storage. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Global tables consistent across all shards (within acceptable lag)
- [ ] Local joins with global data work without cross-shard queries
- [ ] Update propagation completes within SLA

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Read from local shard, write to central applied
- [ ] Cache-as-global-table applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify tables that must exist on all shards (global reference data) completed
- [ ] Choose replication strategy: completed
- [ ] Implement write path: when reference data changes, update on all shards completed
- [ ] Implement read path: read global data from local shard (no cross-shard query) completed
- [ ] Handle consistency: eventual consistency is typical for global tables completed

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

- [ ] Treating large tables as global**: Tables with millions of rows should not be global. Replicating 10M rows to 16 shards wastes 160M rows of storage. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Global tables exist on all shards
- [ ] Reference data is consistent across shards (within acceptable window)
- [ ] Joins between global and local data work within shard
- [ ] Update propagation works correctly
- [ ] Reference data updates propagate to all shards
- [ ] Global tables consistent across all shards (within acceptable lag)
- [ ] Local joins with global data work without cross-shard queries
- [ ] Update propagation completes within SLA
- [ ] All shards have consistent global data within 60 seconds of update
- [ ] Zero persistent inconsistencies detected by reconciliation

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
- [ ] Global table update fails on one shard â€” inconsistency prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Treating large tables as global**: Tables with millions of rows should not be global. Replicating 10M rows to 16 shards wastes 160M rows of storage. prevented

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
