# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.8 Cross-shard join limitations (alternative: denormalization, application-level joins)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Shard groups applied
- [ ] Application-level join applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Designing joins without considering shard key**: If `orders` and `users` have different shard keys, joining them requires full fan-out. Pick a shared shard key. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] All critical joins are within a single shard
- [ ] Cross-shard joins are either eliminated or handled at application level
- [ ] Zero database-level cross-shard join attempts

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Shard groups applied
- [ ] Application-level join applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify all joins in the data model completed
- [ ] For each join, check if related tables share the same shard key: completed
- [ ] For same-shard-key joins: co-locate data by sharding with same key completed
- [ ] For cross-shard joins: completed
- [ ] Document all cross-shard join workarounds completed

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

- [ ] Designing joins without considering shard key**: If `orders` and `users` have different shard keys, joining them requires full fan-out. Pick a shared shard key. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tables that need joins share the same shard key
- [ ] Cross-shard joins are eliminated or handled at application level
- [ ] Denormalization doesn't cause data inconsistency
- [ ] Application-level joins don't create N+1 query patterns
- [ ] Denormalized data eliminates the need for cross-shard join
- [ ] All critical joins are within a single shard
- [ ] Cross-shard joins are either eliminated or handled at application level
- [ ] Zero database-level cross-shard join attempts
- [ ] Cross-shard joins eliminated for denormalized relationships
- [ ] Data consistency between source and denormalized copies within acceptable window

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
- [ ] Eloquent relations load data across shards without awareness prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Designing joins without considering shard key**: If `orders` and `users` have different shard keys, joining them requires full fan-out. Pick a shared shard key. prevented

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
