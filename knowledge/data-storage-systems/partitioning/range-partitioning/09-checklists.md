# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.1 Range partitioning (BY RANGE, RANGE COLUMNS in MySQL)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Monthly partitioning applied
- [ ] Archival by partition drop applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Too many partitions**: MySQL max 8192 partitions per table. PostgreSQL max depends on implementation (thousands). 100-500 is practical. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Queries prune to only relevant partitions
- [ ] Old partitions archived and dropped on schedule
- [ ] Partition count stable (new added, old removed)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Monthly partitioning applied
- [ ] Archival by partition drop applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Design range boundaries based on query patterns: completed
- [ ] Create partitioned table with future partitions: completed
- [ ] For MySQL, prefer `RANGE COLUMNS(created_at)` for date columns (avoids function wrapper) completed
- [ ] Automate partition creation: scheduled job creates next period's partition before current fills completed
- [ ] Automate old partition archival: move data out, then DROP old partition completed

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

- [ ] Too many partitions**: MySQL max 8192 partitions per table. PostgreSQL max depends on implementation (thousands). 100-500 is practical. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Partition pruning works (verify with EXPLAIN)
- [ ] Queries include partition key in WHERE
- [ ] Partition creation automated (scheduled job)
- [ ] Old partition archival planned and automated
- [ ] Partition count stays within practical limits (100-500)
- [ ] Queries prune to only relevant partitions
- [ ] Old partitions archived and dropped on schedule
- [ ] Partition count stable (new added, old removed)

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
- [ ] Data written to future partition (VALUES LESS THAN MAXVALUE) unexpectedly prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Too many partitions**: MySQL max 8192 partitions per table. PostgreSQL max depends on implementation (thousands). 100-500 is practical. prevented

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
