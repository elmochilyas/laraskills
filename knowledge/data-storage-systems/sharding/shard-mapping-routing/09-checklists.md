# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.5 Shard mapping and routing (service-side routing, proxy-level routing)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Service-side for Laravel applied
- [ ] Proxy-level for complex routing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Hardcoded shard routing**: `if ($id < 1000000) { shard 1 }`. Brittle. Always use a routing class or lookup. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] All queries route to correct shard
- [ ] ShardRouter is deterministic and fast
- [ ] Fan-out queries execute correctly

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Service-side for Laravel applied
- [ ] Proxy-level for complex routing applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Implement `ShardRouter` class with methods: completed
- [ ] For service-side routing: completed
- [ ] For proxy-level routing (ProxySQL, Vitess): completed
- [ ] Handle fan-out queries: Query all shards in parallel, aggregate results completed
- [ ] Implement `ShardRouter::getConnectionName($shardKey): string` completed

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

- [ ] Hardcoded shard routing**: `if ($id < 1000000) { shard 1 }`. Brittle. Always use a routing class or lookup. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] ShardRouter maps same key to same shard consistently
- [ ] Queries with shard key route to single shard
- [ ] Fan-out queries execute correctly across all shards
- [ ] Proxy-level routing (if used) parses and routes correctly
- [ ] All queries use ShardRouter for connection selection
- [ ] All queries route to correct shard
- [ ] ShardRouter is deterministic and fast
- [ ] Fan-out queries execute correctly
- [ ] All queries route to correct single shard when shard key is present
- [ ] Fan-out queries return complete, correct results

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
- [ ] ShardRouter not deterministic â€” same key routes to different shards prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Hardcoded shard routing**: `if ($id < 1000000) { shard 1 }`. Brittle. Always use a routing class or lookup. prevented

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
