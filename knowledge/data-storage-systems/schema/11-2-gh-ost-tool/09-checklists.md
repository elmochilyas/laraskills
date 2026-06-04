# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.2 gh-ost (GitHub's online schema migration tool for MySQL)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] gh-ost for large tables applied
- [ ] gh-ost migration workflow applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running gh-ost without --exact-rowcount**: gh-ost estimates row count. Exact count via `SELECT COUNT(*)` takes time on large tables. Acceptable for accuracy. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema change completes without production downtime
- [ ] Test-on-replica validates timing before production run
- [ ] Throttling prevents replication lag spikes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] gh-ost for large tables applied
- [ ] gh-ost migration workflow applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Verify binlog settings: `binlog_format=ROW`, `binlog_row_image=FULL` completed
- [ ] Run test on replica: `gh-ost --test-on-replica --host=replica_host --alter "ADD COLUMN ..." --table t --database d --execute` completed
- [ ] Review test output for row count, timing, and errors completed
- [ ] Run on primary: `gh-ost --alter "ADD COLUMN ..." --table t --database d --execute` completed
- [ ] Monitor via socket: `echo progress | nc -U /tmp/gh-ost.t.sock` completed

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

- [ ] Running gh-ost without --exact-rowcount**: gh-ost estimates row count. Exact count via `SELECT COUNT(*)` takes time on large tables. Acceptable for accuracy. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] binlog_format is ROW with row_image FULL
- [ ] Test-on-replica completed successfully
- [ ] Disk space sufficient for shadow table
- [ ] Binlog retention covers migration duration
- [ ] Cut-over lock duration is < 1 second
- [ ] Schema change completes without production downtime
- [ ] Test-on-replica validates timing before production run
- [ ] Throttling prevents replication lag spikes
- [ ] Cut-over completes within sub-second lock window
- [ ] Binlog retention covers the full migration duration

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
- [ ] ### Insufficient binlog retention prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running gh-ost without --exact-rowcount**: gh-ost estimates row count. Exact count via `SELECT COUNT(*)` takes time on large tables. Acceptable for accuracy. prevented

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
