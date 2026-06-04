# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.10 MySQL partition limitations (no FK support, unique key must include partition key, max 8192 partitions)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Application-level referential integrity applied
- [ ] Composite unique via partition key applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Creating FK on partitioned table**: MySQL silently ignores the FK or returns an error. Always remove FK references from partitioned table schemas. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] No FK references on partitioned tables
- [ ] All unique indexes include partition key
- [ ] Partition count monitored and under limits

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Application-level referential integrity applied
- [ ] Composite unique via partition key applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] **For foreign keys on partitioned tables**: completed
- [ ] **For unique indexes on partitioned tables**: completed
- [ ] **For partition count limits**: completed
- [ ] **Document all workarounds** so future developers understand why FK/uniques are handled differently completed

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

- [ ] Creating FK on partitioned table**: MySQL silently ignores the FK or returns an error. Always remove FK references from partitioned table schemas. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] FK references removed from partitioned table schema
- [ ] Application-level referential integrity implemented where needed
- [ ] All unique indexes on partitioned tables include partition key
- [ ] Partition count well under 8192 (preferably under 500)
- [ ] Workarounds documented in code comments
- [ ] No FK references on partitioned tables
- [ ] All unique indexes include partition key
- [ ] Partition count monitored and under limits
- [ ] Referential integrity achieved via application or alternative mechanism
- [ ] Workarounds documented and understood by the team

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
- [ ] FK on partitioned table silently ignored by MySQL (no error) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Creating FK on partitioned table**: MySQL silently ignores the FK or returns an error. Always remove FK references from partitioned table schemas. prevented

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
