# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.14 pgroll tool (PostgreSQL, reversible expand-contract)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Expand-contract pattern applied
- [ ] Blue-green schema deployment applied
- [ ] Online schema change applied
- [ ] Idempotent migration scripts applied
- [ ] Migration as code applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] - **Running migrations without testing**: Applying complex schema changes (pgroll, pg_repack, instant DDL) directly to production without staging validation can corrupt data or cause downtime. Always test migration workflows in a staging environment that mirrors production schema and data volume. prevented
- [ ] - **Missing rollback plan**: For tools like pgroll that support reversible migrations, failing to test the rollback path leaves the team unable to recover from failed migrations. Test both forward and backward migration paths before production application. prevented
- [ ] - **Ignoring lock implications**: Even "instant" DDL operations (MySQL INSTANT ADD COLUMN) can cause metadata locks under concurrent DML workload. Monitor lock wait times during migration windows and schedule during low-traffic periods. prevented
- [ ] - **Not accounting for replication lag**: Schema changes on a primary database propagate as DDL statements to replicas, which can cause replication lag or break replication entirely if the DDL is not compatible. Apply changes to replicas first or use online DDL tools that support replica safety. prevented
- [ ] - **Overlooking storage impact**: Schema migration tools may create temporary tables, additional indexes, or log files that consume significant storage. Ensure sufficient free space before initiating migrations. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema changes applied with zero application downtime
- [ ] Migration is fully reversible at any phase

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Expand-contract pattern applied
- [ ] Blue-green schema deployment applied
- [ ] Online schema change applied
- [ ] Idempotent migration scripts applied
- [ ] Migration as code applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Start pgroll with `--mode=read-write` to apply the migration in dual-write mode completed
- [ ] Application writes to both old and new schema; reads served from old schema completed
- [ ] Monitor for errors, performance degradation, data inconsistencies completed
- [ ] Switch to `--mode=read-write-new` — application reads from new schema, writes to both completed
- [ ] Monitor again for errors completed

---

# Performance Checklist

- [ ] Performance: - View-based schema versioning adds negligible query overhead. PostgreSQL optimizes view resolution into the underlying table access plan.
- [ ] Performance: - Column backfilling via triggers during an active migration adds per-row overhead for INSERT and UPDATE operations. Benchmark write-heavy workload...
- [ ] Performance: - The `pgroll complete` phase (removing old schema versions) is a metadata-only operation that completes in milliseconds.
- [ ] Performance: - Long-running migrations with active backfill triggers generate increased WAL traffic due to trigger-based column synchronization. Monitor WAL gen...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] - **Running migrations without testing**: Applying complex schema changes (pgroll, pg_repack, instant DDL) directly to production without staging validation can corrupt data or cause downtime. Always test migration workflows in a staging environment that mirrors production schema and data volume. prevented
- [ ] - **Missing rollback plan**: For tools like pgroll that support reversible migrations, failing to test the rollback path leaves the team unable to recover from failed migrations. Test both forward and backward migration paths before production application. prevented
- [ ] - **Ignoring lock implications**: Even "instant" DDL operations (MySQL INSTANT ADD COLUMN) can cause metadata locks under concurrent DML workload. Monitor lock wait times during migration windows and schedule during low-traffic periods. prevented
- [ ] - **Not accounting for replication lag**: Schema changes on a primary database propagate as DDL statements to replicas, which can cause replication lag or break replication entirely if the DDL is not compatible. Apply changes to replicas first or use online DDL tools that support replica safety. prevented
- [ ] - **Overlooking storage impact**: Schema migration tools may create temporary tables, additional indexes, or log files that consume significant storage. Ensure sufficient free space before initiating migrations. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] PostgreSQL 14+ with required extensions
- [ ] Application code is compatible with both schema versions
- [ ] Dual-write mode verified for correctness
- [ ] Read switch tested on staging first
- [ ] Rollback path tested and confirmed working
- [ ] Schema changes applied with zero application downtime
- [ ] Migration is fully reversible at any phase
- [ ] Dual-write is verified for data consistency
- [ ] NOT NULL constraints added without full table scan
- [ ] View-based approach does not degrade query performance

---

# Maintainability Checklist

- [ ] Expand-contract pattern applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Application not compatible with both schemas prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] - **Running migrations without testing**: Applying complex schema changes (pgroll, pg_repack, instant DDL) directly to production without staging validation can corrupt data or cause downtime. Always test migration workflows in a staging environment that mirrors production schema and data volume. prevented
- [ ] - **Missing rollback plan**: For tools like pgroll that support reversible migrations, failing to test the rollback path leaves the team unable to recover from failed migrations. Test both forward and backward migration paths before production application. prevented
- [ ] - **Ignoring lock implications**: Even "instant" DDL operations (MySQL INSTANT ADD COLUMN) can cause metadata locks under concurrent DML workload. Monitor lock wait times during migration windows and schedule during low-traffic periods. prevented
- [ ] - **Not accounting for replication lag**: Schema changes on a primary database propagate as DDL statements to replicas, which can cause replication lag or break replication entirely if the DDL is not compatible. Apply changes to replicas first or use online DDL tools that support replica safety. prevented
- [ ] - **Overlooking storage impact**: Schema migration tools may create temporary tables, additional indexes, or log files that consume significant storage. Ensure sufficient free space before initiating migrations. prevented
- [ ] - **Version mismatch**: Migration tools evolve rapidly; using an older version of pgroll, pg_repack, or MySQL may miss bug fixes or introduce incompatibilities with the target database version. Always use the latest stable release compatible with your database. prevented

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
