# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.3 pt-online-schema-change (Percona Toolkit trigger-based online migration)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] pt-osc for older MySQL (< 5.6) applied
- [ ] pt-osc with foreign keys applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Trigger overhead on write-heavy tables**: Triggers add latency to every INSERT/UPDATE/DELETE. For tables with > 1000 writes/second, use gh-ost (triggerless). prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Migration completes without production downtime
- [ ] Dry run validates operation before execution
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

- [ ] pt-osc for older MySQL (< 5.6) applied
- [ ] pt-osc with foreign keys applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Perform dry run: `pt-online-schema-change --dry-run D=myapp,t=orders --alter "ADD COLUMN status INT"` completed
- [ ] Review dry run output for FK issues, trigger conflicts, and replica checks completed
- [ ] Run migration: `pt-online-schema-change --alter "ADD COLUMN status INT" D=myapp,t=orders --execute` completed
- [ ] Monitor progress (row copy percentage, timing) in the output completed
- [ ] After completion, verify the new schema and data integrity completed

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

- [ ] Trigger overhead on write-heavy tables**: Triggers add latency to every INSERT/UPDATE/DELETE. For tables with > 1000 writes/second, use gh-ost (triggerless). prevented
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
- [ ] Chunk size is appropriate for the workload
- [ ] Replication lag threshold is configured
- [ ] FK handling method specified for FK-referenced tables
- [ ] No existing triggers on the target table
- [ ] Migration completes without production downtime
- [ ] Dry run validates operation before execution
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
- [ ] Trigger overhead on write-heavy tables**: Triggers add latency to every INSERT/UPDATE/DELETE. For tables with > 1000 writes/second, use gh-ost (triggerless). prevented

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
