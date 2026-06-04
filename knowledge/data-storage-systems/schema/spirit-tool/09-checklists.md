# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.13 Spirit tool (gh-ost successor for MySQL 8.0+)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Migration from gh-ost applied
- [ ] Performance schema reliance applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using it on MySQL 5.7**: Not supported. Use gh-ost or pt-osc for 5.7 environments. prevented
- [ ] Disabling performance_schema**: Spirit loses its primary throttling data source. Falls back to less accurate metrics. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Migration completes without production downtime
- [ ] Row copy is measurably faster than legacy tools
- [ ] Throttling accurately prevents resource contention

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Migration from gh-ost applied
- [ ] Performance schema reliance applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Verify MySQL 8.0+ compatibility and required settings completed
- [ ] Ensure `performance_schema` is enabled for throttling data completed
- [ ] Run Spirit with the ALTER statement, similar to gh-ost CLI syntax completed
- [ ] Monitor progress via Spirit's status output completed
- [ ] Verify cut-over completed and new schema is active completed

---

# Performance Checklist

- [ ] Performance: - Up to 2x faster row copy than gh-ost on large tables in benchmarks.
- [ ] Performance: - Reduced binlog storage requirements during migration.
- [ ] Performance: - More accurate throttling via performance_schema reduces workload impact.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using it on MySQL 5.7**: Not supported. Use gh-ost or pt-osc for 5.7 environments. prevented
- [ ] Disabling performance_schema**: Spirit loses its primary throttling data source. Falls back to less accurate metrics. prevented
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
- [ ] binlog_format is ROW
- [ ] Disk space sufficient for shadow table
- [ ] Test migration run on staging first
- [ ] Row copy speed monitored and acceptable
- [ ] Migration completes without production downtime
- [ ] Row copy is measurably faster than legacy tools
- [ ] Throttling accurately prevents resource contention
- [ ] Cut-over completes within acceptable lock window
- [ ] Performance schema metrics enable self-regulation

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
- [ ] Using it on MySQL 5.7**: Not supported. Use gh-ost or pt-osc for 5.7 environments. prevented
- [ ] Disabling performance_schema**: Spirit loses its primary throttling data source. Falls back to less accurate metrics. prevented

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
