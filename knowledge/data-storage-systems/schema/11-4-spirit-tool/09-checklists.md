# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.4 Spirit (Physical Replication-based online schema change for MySQL)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Spirit for RDS/Aurora applied
- [ ] Spirit for large tables applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Spirit requires disk space**: Physical copy requires space for both original and shadow table. Ensure enough free storage. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Migration completes without production downtime
- [ ] Row copy is measurably faster than row-by-row tools
- [ ] Physical copy does not exceed disk space limits

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Spirit for RDS/Aurora applied
- [ ] Spirit for large tables applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Verify MySQL 8.0+ compatibility and performance_schema is enabled completed
- [ ] Run Spirit with the ALTER statement, similar to gh-ost CLI syntax completed
- [ ] Monitor progress via Spirit's status output completed
- [ ] Verify cut-over completed and new schema is active completed
- [ ] Confirm no artifacts remain after migration completed

---

# Performance Checklist

- [ ] Performance: Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Spirit requires disk space**: Physical copy requires space for both original and shadow table. Ensure enough free storage. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] MySQL 8.0+ with performance_schema enabled
- [ ] Disk space sufficient for original + shadow table
- [ ] Test migration run on staging environment
- [ ] Row copy speed is acceptable
- [ ] Cut-over lock duration is minimal
- [ ] Migration completes without production downtime
- [ ] Row copy is measurably faster than row-by-row tools
- [ ] Physical copy does not exceed disk space limits
- [ ] Cut-over completes within acceptable lock window
- [ ] Performance schema metrics enable accurate throttling

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### performance_schema disabled prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Spirit requires disk space**: Physical copy requires space for both original and shadow table. Ensure enough free storage. prevented

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
