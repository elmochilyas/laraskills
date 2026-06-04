# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.16 Data retention policies with partitioning (auto-drop old partitions)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Retention schedule applied
- [ ] Graceful retention applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] DELETE for data retention on large tables**: `DELETE FROM orders WHERE created_at < NOW() - INTERVAL 12 MONTH` — huge DELETE, table bloat, slow. Always use partition DROP. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Old partitions dropped automatically on schedule
- [ ] No DELETE statements used for data retention
- [ ] Retention period complies with regulatory requirements

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Retention schedule applied
- [ ] Graceful retention applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Define retention policy for each table: completed
- [ ] Create a scheduled job to enforce retention: completed
- [ ] Implement retention stored procedure (MySQL): completed
- [ ] Schedule execution: completed
- [ ] Add grace period: don't drop immediately at retention boundary completed

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

- [ ] DELETE for data retention on large tables**: `DELETE FROM orders WHERE created_at < NOW() - INTERVAL 12 MONTH` — huge DELETE, table bloat, slow. Always use partition DROP. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Retention policy defined and documented per table
- [ ] Scheduled job creates and drops partitions
- [ ] Grace period applied (data retained slightly beyond minimum)
- [ ] Backup performed before DROP PARTITION (if archival needed)
- [ ] No DELETE queries used for retention (only DROP PARTITION)
- [ ] Old partitions dropped automatically on schedule
- [ ] No DELETE statements used for data retention
- [ ] Retention period complies with regulatory requirements
- [ ] Backup created before each DROP PARTITION
- [ ] Scheduled job runs reliably and alerts on failure

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
- [ ] Using DELETE instead of DROP PARTITION â€” table bloat and slow cleanup prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] DELETE for data retention on large tables**: `DELETE FROM orders WHERE created_at < NOW() - INTERVAL 12 MONTH` — huge DELETE, table bloat, slow. Always use partition DROP. prevented

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
