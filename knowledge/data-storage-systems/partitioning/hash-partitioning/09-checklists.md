# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.3 Hash partitioning (BY HASH, BY KEY for even distribution)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Hash partition for write scaling applied
- [ ] Hash + range composite applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Adding/removing hash partitions**: Changing `PARTITIONS N` requires rebuilding all data. Choose partition count carefully. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Data evenly distributed across partitions
- [ ] Queries with partition key prune correctly
- [ ] Partition count matches growth plan (won't need to change soon)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Hash partition for write scaling applied
- [ ] Hash + range composite applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Determine the number of partitions: completed
- [ ] Create hash-partitioned table: completed
- [ ] For MySQL, prefer `PARTITION BY KEY(user_id)` if primary key includes it: completed
- [ ] Queries must include the partition key for partition pruning: completed
- [ ] To change partition count: must rebuild entire table (REORGANIZE or recreate) completed

---

# Performance Checklist

- [ ] Performance: Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Adding/removing hash partitions**: Changing `PARTITIONS N` requires rebuilding all data. Choose partition count carefully. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Partition count is a power of 2 for even distribution
- [ ] Query includes partition key for pruning
- [ ] Data distributed evenly across partitions (verify with COUNT per partition)
- [ ] No partition larger than average by more than 10%
- [ ] Partition count documented (changing requires rebuild)
- [ ] Data evenly distributed across partitions
- [ ] Queries with partition key prune correctly
- [ ] Partition count matches growth plan (won't need to change soon)

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Include Partition Key In WHERE prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Changing partition count requires full table rebuild prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Adding/removing hash partitions**: Changing `PARTITIONS N` requires rebuilding all data. Choose partition count carefully. prevented

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
