# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.3 Range-based sharding (key ranges, predictable splits)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Date range sharding applied
- [ ] ID range with pre-splitting applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Monotonically increasing key without mitigation**: All new writes go to the last shard. Hot shard on the highest-range shard. Combine with hash to distribute. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Range queries with shard key hit exactly one shard
- [ ] Data distribution across ranges is monitored and managed
- [ ] Hot ranges are detected and split before affecting performance

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Date range sharding applied
- [ ] ID range with pre-splitting applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Define contiguous key ranges per shard: completed
- [ ] Implement range lookup: given key value, find containing shard completed
- [ ] Route queries: completed
- [ ] Monitor range utilization: if one range fills faster than others, split it completed
- [ ] Split hot range: divide into two sub-ranges, migrate data to new shard completed

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

- [ ] Monotonically increasing key without mitigation**: All new writes go to the last shard. Hot shard on the highest-range shard. Combine with hash to distribute. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Ranges cover all possible key values (no gaps)
- [ ] Range queries with shard key hit correct shard
- [ ] Hot range detection and splitting tested
- [ ] Range-to-shard mapping is fast (< 1ms lookup)
- [ ] Hot range identified and split point determined
- [ ] Range queries with shard key hit exactly one shard
- [ ] Data distribution across ranges is monitored and managed
- [ ] Hot ranges are detected and split before affecting performance
- [ ] Hot range split completes within acceptable timeframe
- [ ] Both resulting ranges have balanced utilization

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
- [ ] Monotonically increasing key: last range is hot (all new writes) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Monotonically increasing key without mitigation**: All new writes go to the last shard. Hot shard on the highest-range shard. Combine with hash to distribute. prevented

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
