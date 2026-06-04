# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.2 Hash-based sharding (consistent hashing, modulo ring, virtual buckets)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Modulo for fixed shard count applied
- [ ] Consistent hashing for elastic sharding applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Modulo for dynamic shard count**: Adding one shard changes every key's shard. Requires full re-shard. Use consistent hashing if shard growth is expected. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Data distributed evenly across shards (±10% of uniform)
- [ ] All queries with shard key hit exactly one shard
- [ ] Hash function is deterministic and fast

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Modulo for fixed shard count applied
- [ ] Consistent hashing for elastic sharding applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Choose hash function: `crc32($key) % N` or `md5($key) % N` completed
- [ ] For each query: compute `$shardId = ShardRouter::hash($shardKey) % $totalShards` completed
- [ ] Route query to `DB::connection('shard_'.$shardId)` completed
- [ ] For writes: insert data with hash-based shard assignment completed
- [ ] For reads with shard key: compute shard and query directly (no fan-out) completed

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

- [ ] Modulo for dynamic shard count**: Adding one shard changes every key's shard. Requires full re-shard. Use consistent hashing if shard growth is expected. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Hash function distributes keys evenly (simulate with sample data)
- [ ] Same key always maps to same shard (deterministic)
- [ ] Queries with shard key route to single shard
- [ ] Queries without shard key fan-out correctly
- [ ] Strategy matches shard count stability requirements
- [ ] Data distributed evenly across shards (±10% of uniform)
- [ ] All queries with shard key hit exactly one shard
- [ ] Hash function is deterministic and fast
- [ ] Strategy correctly handles expected shard count changes
- [ ] Data movement on rebalance is within acceptable limit

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
- [ ] Hash function produces collisions (different keys â†’ same shard) â€” OK prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Modulo for dynamic shard count**: Adding one shard changes every key's shard. Requires full re-shard. Use consistent hashing if shard growth is expected. prevented

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
