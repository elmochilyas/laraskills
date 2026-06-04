# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.7 Fan-out queries (broadcast to all shards, aggregate results)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Coroutine fan-out with Swoole/Octane applied
- [ ] Timeout per shard applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Sequential fan-out**: Query shard 1, wait, query shard 2, wait — N × latency. Always fan-out in parallel. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Fan-out queries return complete results within acceptable latency
- [ ] Slow shard doesn't block entire query (timeout works)
- [ ] Partial failures don't cause application errors

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Coroutine fan-out with Swoole/Octane applied
- [ ] Timeout per shard applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify queries that must fan-out (no shard key in WHERE clause) completed
- [ ] Dispatch query to all shards in parallel: completed
- [ ] Implement timeout per shard: if a shard doesn't respond in time, skip it (partial results) completed
- [ ] Aggregate results: merge sorted lists, sum counts, combine sets completed
- [ ] Handle partial failures: log failed shard, return partial results with warning completed

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

- [ ] Sequential fan-out**: Query shard 1, wait, query shard 2, wait — N × latency. Always fan-out in parallel. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Parallel execution works across all shards
- [ ] Result aggregation is correct (merge, sum, combine)
- [ ] Timeout prevents slow shard from blocking entire result
- [ ] Partial failures are handled gracefully
- [ ] Executor dispatches to all shards in parallel
- [ ] Fan-out queries return complete results within acceptable latency
- [ ] Slow shard doesn't block entire query (timeout works)
- [ ] Partial failures don't cause application errors
- [ ] Fan-out executor returns complete results
- [ ] Timeout prevents slow shard from blocking

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
- [ ] Sequential fan-out (query shards one by one) â€” slowest shard Ã— N prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Sequential fan-out**: Query shard 1, wait, query shard 2, wait — N × latency. Always fan-out in parallel. prevented

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
