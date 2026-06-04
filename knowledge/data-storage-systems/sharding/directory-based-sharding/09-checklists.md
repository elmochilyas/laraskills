# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.4 Directory-based sharding (lookup table, flexible but extra hop)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cache-backed shard map applied
- [ ] Shard map in application memory applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Uncached shard map lookup**: Every query hits the shard map database. 2x database load (lookup + actual query). Always cache. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Shard map lookup completes in < 2ms (with cache)
- [ ] Map HA ensures zero downtime for lookup table
- [ ] Rebalancing is transparent (update map, migrate data, done)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Cache-backed shard map applied
- [ ] Shard map in application memory applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Create shard map: `shard_map(key_hash, shard_id, created_at)` completed
- [ ] On write: insert key-to-shard mapping, then write data to shard completed
- [ ] On read: lookup shard_id from map, then query shard completed
- [ ] Cache shard map entries aggressively (Redis, local memory) completed
- [ ] On rebalance: update shard map, migrate data, then update map again (point reads to new shard) completed

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

- [ ] Uncached shard map lookup**: Every query hits the shard map database. 2x database load (lookup + actual query). Always cache. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Shard map lookup returns correct shard_id
- [ ] Cache hit rate > 99% for shard map queries
- [ ] Shard map is highly available (replicated, failover tested)
- [ ] Rebalance updates mapping correctly
- [ ] Lookup table is deployed with HA configuration
- [ ] Shard map lookup completes in < 2ms (with cache)
- [ ] Map HA ensures zero downtime for lookup table
- [ ] Rebalancing is transparent (update map, migrate data, done)
- [ ] Shard map availability > 99.99%
- [ ] P99 lookup latency < 5ms

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
- [ ] Shard map is single point of failure (use HA cluster) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Uncached shard map lookup**: Every query hits the shard map database. 2x database load (lookup + actual query). Always cache. prevented

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
