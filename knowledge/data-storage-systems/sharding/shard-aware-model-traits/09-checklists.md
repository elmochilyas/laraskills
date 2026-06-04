# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.14 Shard-aware model traits (getConnectionName, Shardable)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Trait with caching applied
- [ ] Global scope for shard filtering applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not overriding getConnectionName on relationships**: Related models may not use the same shard connection. Ensure related models share the shard connection or handle cross-shard explicitly. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Models automatically use correct shard connection
- [ ] Cross-shard relationship loading is handled correctly
- [ ] Zero model queries routed to wrong shard

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Trait with caching applied
- [ ] Global scope for shard filtering applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Create `ShardAware` trait: completed
- [ ] Implement `resolveRouteKey()`: extract shard key from model attributes completed
- [ ] Override relationship loading to verify related models are on same shard (or use application-level join) completed
- [ ] Add `getShardId()` method that returns the shard ID for this model instance completed
- [ ] Apply trait to all sharded models completed

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

- [ ] Not overriding getConnectionName on relationships**: Related models may not use the same shard connection. Ensure related models share the shard connection or handle cross-shard explicitly. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Models use correct shard connection automatically
- [ ] Queries include shard key for routing
- [ ] Cross-shard relationships detected and handled
- [ ] `getShardId()` returns correct shard
- [ ] `getShardId()` returns correct shard for all models
- [ ] Models automatically use correct shard connection
- [ ] Cross-shard relationship loading is handled correctly
- [ ] Zero model queries routed to wrong shard
- [ ] `getShardId()` returns correct shard for every model
- [ ] Used consistently in debugging and cross-shard detection

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
- [ ] Model saved to wrong shard (connection not set before write) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not overriding getConnectionName on relationships**: Related models may not use the same shard connection. Ensure related models share the shard connection or handle cross-shard explicitly. prevented

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
