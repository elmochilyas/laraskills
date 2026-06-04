# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.17 Read replica per shard (shard-level read scaling)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read replica config per shard applied
- [ ] Replica lag monitoring per shard applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Same replica config for all shards**: Hot shards need more read capacity. Monitor per-shard replica lag and add replicas to hot shards. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Read traffic offloaded to replicas for all shards
- [ ] Replica lag within acceptable threshold per shard
- [ ] Read replica failure doesn't cause service disruption

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Read replica config per shard applied
- [ ] Replica lag monitoring per shard applied
- [ ] Always Monitor Replica Lag followed
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Deploy read replicas for shards with high read traffic completed
- [ ] Configure replication: each shard primary → its replica(s) completed
- [ ] Configure Laravel read/write connections per shard: completed
- [ ] For shards with low read traffic, share replicas or skip completed
- [ ] Configure sticky writes per shard (read-after-write consistency) completed

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

- [ ] Same replica config for all shards**: Hot shards need more read capacity. Monitor per-shard replica lag and add replicas to hot shards. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Never Rely On Cross-Shard Transactions followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Read replicas configured for each shard
- [ ] Read/write splitting works per shard connection
- [ ] Replica lag monitored per shard
- [ ] Read traffic offloaded to replicas
- [ ] Freshness-critical reads go to primary
- [ ] Read traffic offloaded to replicas for all shards
- [ ] Replica lag within acceptable threshold per shard
- [ ] Read replica failure doesn't cause service disruption
- [ ] Freshness-critical reads always served fresh
- [ ] Replica reads offload significant traffic from primaries

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Replica lag causes stale reads on one shard but not others prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Same replica config for all shards**: Hot shards need more read capacity. Monitor per-shard replica lag and add replicas to hot shards. prevented

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
