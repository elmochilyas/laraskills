# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.6 Shard-aware ID generation (Snowflake, database sequences, UUID v7)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Snowflake for embedded shard routing applied
- [ ] UUID v7 for global uniqueness applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] auto_increment across shards**: Two shards may generate the same ID. Always use shard-aware sequences or global ID generators. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] IDs are globally unique across all shards
- [ ] Shard can be determined from ID without a lookup
- [ ] ID generation handles peak throughput without collisions

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Snowflake for embedded shard routing applied
- [ ] UUID v7 for global uniqueness applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Choose ID strategy: completed
- [ ] Implement Snowflake generator: given shard ID and timestamp, produce unique 64-bit ID completed
- [ ] Extract shard ID from Snowflake ID: `$shardId = ($id >> 12) & 0x3FF` completed
- [ ] Use extracted shard ID for routing: `ShardRouter::getConnection($shardId)` completed
- [ ] For UUID v7: store shard map entry on first write, cache for subsequent reads completed

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

- [ ] auto_increment across shards**: Two shards may generate the same ID. Always use shard-aware sequences or global ID generators. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] IDs are globally unique across all shards
- [ ] Shard ID can be extracted from Snowflake IDs
- [ ] IDs are monotonically increasing (Snowflake, UUID v7)
- [ ] ID generation handles clock skew and high concurrency
- [ ] IDs are unique across all shards and time
- [ ] IDs are globally unique across all shards
- [ ] Shard can be determined from ID without a lookup
- [ ] ID generation handles peak throughput without collisions
- [ ] IDs are globally unique across all shards
- [ ] Shard extraction works for direct routing

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
- [ ] Clock skew: Snowflake IDs go backward (use clock drift tolerance) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] auto_increment across shards**: Two shards may generate the same ID. Always use shard-aware sequences or global ID generators. prevented

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
