# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.12 pt-online-schema-change (trigger-based, FK support, Percona Toolkit)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] FK management applied
- [ ] Chunk-size tuning applied
- [ ] Replication throttle applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not indexing the ghost table correctly**: The ghost table inherits the original schema + ALTER, but if the original has no suitable unique index for chunking, pt-osc falls back to `--chunk-index` selection, which may be suboptimal. prevented
- [ ] Trigger deadlock cascade**: Under high concurrency, trigger-lock interactions can escalate to deadlocks. This is the most common pt-osc failure mode. prevented
- [ ] FK constraint rebuild fails**: If a referencing table is large, the FK rebuild during swap can take significant time and block writes. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Migration completes without production downtime
- [ ] Dry run validates the operation before execution
- [ ] Trigger overhead is within acceptable limits

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] FK management applied
- [ ] Chunk-size tuning applied
- [ ] Replication throttle applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Perform a dry run: `pt-online-schema-change --dry-run D=myapp,t=orders --alter "ADD COLUMN status INT"` completed
- [ ] Review the dry run output for potential issues (FKs, triggers, replicas) completed
- [ ] Run the migration: `pt-online-schema-change --alter "ADD COLUMN status INT" D=myapp,t=orders --execute` completed
- [ ] Monitor progress in the output (row copy percentage, timing) completed
- [ ] After completion, verify the new schema and data integrity completed

---

# Performance Checklist

- [ ] Performance: - Trigger overhead persists for the entire migration duration — every INSERT/UPDATE/DELETE on the original table runs three triggers (AFTER INSERT,...
- [ ] Performance: - Chunk copying competes with application workload for IO and CPU.
- [ ] Performance: - FK constraint rebuild during swap requires locking the referencing tables.
- [ ] Performance: - pt-osc creates an implicit table-level lock briefly during the final RENAME.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not indexing the ghost table correctly**: The ghost table inherits the original schema + ALTER, but if the original has no suitable unique index for chunking, pt-osc falls back to `--chunk-index` selection, which may be suboptimal. prevented
- [ ] Trigger deadlock cascade**: Under high concurrency, trigger-lock interactions can escalate to deadlocks. This is the most common pt-osc failure mode. prevented
- [ ] FK constraint rebuild fails**: If a referencing table is large, the FK rebuild during swap can take significant time and block writes. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Dry run completes without warnings or errors
- [ ] Chunk size is appropriate for the table size and workload
- [ ] Replication lag threshold is configured
- [ ] FK handling method is specified for FK-referenced tables
- [ ] Disk space is sufficient for the shadow table
- [ ] Migration completes without production downtime
- [ ] Dry run validates the operation before execution
- [ ] Trigger overhead is within acceptable limits
- [ ] FK constraints are properly rebuilt after swap
- [ ] Interrupted migrations leave clean state for retry

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
- [ ] ### Trigger deadlock cascade prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not indexing the ghost table correctly**: The ghost table inherits the original schema + ALTER, but if the original has no suitable unique index for chunking, pt-osc falls back to `--chunk-index` selection, which may be suboptimal. prevented
- [ ] Trigger deadlock cascade**: Under high concurrency, trigger-lock interactions can escalate to deadlocks. This is the most common pt-osc failure mode. prevented
- [ ] FK constraint rebuild fails**: If a referencing table is large, the FK rebuild during swap can take significant time and block writes. prevented

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
