# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.9 Cross-shard transaction impossibility (distributed transaction complexity)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Saga pattern applied
- [ ] Single-shard transaction applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming distributed transactions work like local transactions**: Network partitions, coordinator failures, and partial commits make 2PC unreliable. Avoid cross-shard transactions. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] All ACID operations completed within a single shard
- [ ] Cross-shard operations are eventually consistent with compensating rollback
- [ ] Zero distributed transaction failures in production

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Saga pattern applied
- [ ] Single-shard transaction applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify all transactional boundaries: operations that must be atomic completed
- [ ] For each boundary, ensure all data lives on the same shard: completed
- [ ] For cross-shard atomic operations: completed
- [ ] For eventually consistent operations: completed
- [ ] Document all non-ACID operations and their consistency guarantees completed

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

- [ ] Assuming distributed transactions work like local transactions**: Network partitions, coordinator failures, and partial commits make 2PC unreliable. Avoid cross-shard transactions. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All ACID transactions live within a single shard
- [ ] Cross-shard operations use Saga or eventual consistency
- [ ] Compensating transactions implemented for Saga rollback
- [ ] Documentation of consistency guarantees per operation
- [ ] Saga steps execute in correct order
- [ ] All ACID operations completed within a single shard
- [ ] Cross-shard operations are eventually consistent with compensating rollback
- [ ] Zero distributed transaction failures in production
- [ ] Saga completes successfully for normal path
- [ ] Compensating transactions rollback correctly on failure

---

# Maintainability Checklist

- [ ] Saga pattern applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Choose High-Cardinality Shard Key prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Assuming 2PC solves all cross-shard transaction problems (coordinator failure, lock holding) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming distributed transactions work like local transactions**: Network partitions, coordinator failures, and partial commits make 2PC unreliable. Avoid cross-shard transactions. prevented

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
