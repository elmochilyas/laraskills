# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.6 Partition management (ADD, DROP, TRUNCATE, REORGANIZE, REPAIR)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Partition rotation applied
- [ ] Archive and drop applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] ADD PARTITION for non-range partitions**: Cannot ADD PARTITION to hash-partitioned tables without REORGANIZE. Pre-plan hash partition count. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] New partitions created before old ones fill
- [ ] Old partitions dropped according to retention policy
- [ ] Partition count stays within practical limits

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Partition rotation applied
- [ ] Archive and drop applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] **ADD PARTITION** (range/list): completed
- [ ] **DROP PARTITION** (instant archive): completed
- [ ] **TRUNCATE PARTITION**: completed
- [ ] **REORGANIZE PARTITION** (split or merge): completed
- [ ] Automate with scheduled jobs: completed

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

- [ ] ADD PARTITION for non-range partitions**: Cannot ADD PARTITION to hash-partitioned tables without REORGANIZE. Pre-plan hash partition count. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] ADD PARTITION successful (new partition visible in information_schema)
- [ ] DROP PARTITION action backed up first
- [ ] TRUNCATE PARTITION removes data only (structure remains)
- [ ] REORGANIZE completes without data loss
- [ ] Scheduled job creates partitions ahead of time
- [ ] New partitions created before old ones fill
- [ ] Old partitions dropped according to retention policy
- [ ] Partition count stays within practical limits
- [ ] No insert errors due to missing partitions

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
- [ ] ADD PARTITION on hash-partitioned table â€” requires REORGANIZE prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] ADD PARTITION for non-range partitions**: Cannot ADD PARTITION to hash-partitioned tables without REORGANIZE. Pre-plan hash partition count. prevented

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
