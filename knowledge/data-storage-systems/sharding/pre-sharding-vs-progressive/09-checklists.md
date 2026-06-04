# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.23 Pre-sharding vs. progressive sharding strategy
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Pre-shard when growth is predictable applied
- [ ] Progressive when growth is unknown applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Under-sharding initially**: Starting with 2 shards. Both shards become hot within 6 months. Forced rebalance before team is ready. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Chosen approach supports projected growth without major architecture change
- [ ] Rebalancing (if needed) is automated and tested
- [ ] Infrastructure cost is within budget

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Pre-shard when growth is predictable applied
- [ ] Progressive when growth is unknown applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Pre-sharding approach: completed
- [ ] Progressive sharding approach: completed
- [ ] Choose based on: completed
- [ ] Determine total shard capacity needed for 3-5 years (e.g., 256 shards) completed
- [ ] Provision infrastructure for all 256 shards (or use database-per-shard within logical servers) completed

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

- [ ] Under-sharding initially**: Starting with 2 shards. Both shards become hot within 6 months. Forced rebalance before team is ready. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Chosen approach aligns with growth projections
- [ ] Infrastructure budget matches approach requirements
- [ ] Rebalancing strategy defined (if progressive)
- [ ] Dormant shard management defined (if pre-sharding)
- [ ] Pre-determined shard count covers 3-5 year projection
- [ ] Chosen approach supports projected growth without major architecture change
- [ ] Rebalancing (if needed) is automated and tested
- [ ] Infrastructure cost is within budget
- [ ] Pre-sharded capacity covers 3+ years of growth
- [ ] Activation completes without data loss or downtime

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
- [ ] Pre-sharding with too many shards â€” waste of resources prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Under-sharding initially**: Starting with 2 shards. Both shards become hot within 6 months. Forced rebalance before team is ready. prevented

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
