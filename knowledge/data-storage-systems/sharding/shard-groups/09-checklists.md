# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.13 Shard groups (co-located tables that share shard key for joins)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] User-centric shard group applied
- [ ] Tenant-centric shard group applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Random shard key per table**: `users` by `user_id`, `orders` by `order_id` — no table shares a shard key. Every join is cross-shard. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Critical joins operate within a single shard group
- [ ] Cross-group queries are identified and optimized or accepted
- [ ] Group assignment is stable and well-documented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] User-centric shard group applied
- [ ] Tenant-centric shard group applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify entities that need cross-shard joins (e.g., Users and Orders) completed
- [ ] Design shard groups: assign User and Order shards so that related data is in the same group completed
- [ ] Shard by same key: if both use `user_id`, they're co-located on same shard — no group needed completed
- [ ] If different keys: assign ranges of both keys to the same shard group completed
- [ ] Within a group, joins work because data is on the same physical shard completed

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

- [ ] Random shard key per table**: `users` by `user_id`, `orders` by `order_id` — no table shares a shard key. Every join is cross-shard. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Related entities within a group are on the same physical shard
- [ ] Joins within a group work correctly
- [ ] Cross-group queries handle fan-out correctly
- [ ] Group assignment is stable (entities don't move between groups frequently)
- [ ] Frequently joined entities are in same group
- [ ] Critical joins operate within a single shard group
- [ ] Cross-group queries are identified and optimized or accepted
- [ ] Group assignment is stable and well-documented
- [ ] 80%+ of joins operate within a single group
- [ ] Group sizes are balanced

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
- [ ] Entities in same group but on different physical shards â€” group concept broken prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Random shard key per table**: `users` by `user_id`, `orders` by `order_id` — no table shares a shard key. Every join is cross-shard. prevented

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
