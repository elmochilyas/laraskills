# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.16 Swoole/Octane coroutine-aware shard dispatching
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Octane + shard trait applied
- [ ] Timeout per coroutine applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Sequential shard queries in Octane**: Octane doesn't automatically parallelize queries. You must explicitly use coroutines for parallel execution. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Coroutine-based fan-out completes in max(shard_latency) time
- [ ] No deadlocks or connection pool exhaustion
- [ ] Results are correctly aggregated

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Octane + shard trait applied
- [ ] Timeout per coroutine applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify fan-out queries that can benefit from parallel execution completed
- [ ] In Octane with Swoole driver, use `Swoole\Coroutine`: completed
- [ ] For Octane with RoadRunner driver, use `Spiral\RoadRunner\KeyValue` or HTTP pooling completed
- [ ] Implement result aggregation after all coroutines complete completed
- [ ] Handle partial failures: timeout per coroutine, skip failed shards completed

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

- [ ] Sequential shard queries in Octane**: Octane doesn't automatically parallelize queries. You must explicitly use coroutines for parallel execution. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Coroutines execute shard queries in parallel
- [ ] Results aggregated correctly
- [ ] Timeouts prevent slow shard from blocking
- [ ] Connection pool not exhausted by concurrent coroutines
- [ ] Pool.max accounts for maximum concurrent coroutine queries
- [ ] Coroutine-based fan-out completes in max(shard_latency) time
- [ ] No deadlocks or connection pool exhaustion
- [ ] Results are correctly aggregated
- [ ] Pool supports peak coroutine fan-out without connection wait
- [ ] Total connections within database limits

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
- [ ] Coroutine deadlock (all coroutines waiting for same connection) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Sequential shard queries in Octane**: Octane doesn't automatically parallelize queries. You must explicitly use coroutines for parallel execution. prevented

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
