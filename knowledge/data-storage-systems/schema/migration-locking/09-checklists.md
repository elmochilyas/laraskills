# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.12 Migration locking (MySQL metadata locks, advisory locks for coordination)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Check for blocking queries before migration applied
- [ ] Advisory lock for multi-node coordination applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running ALTER TABLE during active query**: A reporting query holds shared MDL. ALTER waits. All subsequent queries queue. App outage. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] No MDL contention during schema migrations
- [ ] Blocking queries are identified and resolved before DDL
- [ ] ALGORITHM=INSTANT avoids MDL where possible

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Check for blocking queries before migration applied
- [ ] Advisory lock for multi-node coordination applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Before migration, check for blocking queries: `SELECT * FROM performance_schema.metadata_locks WHERE object_name = 'orders'` completed
- [ ] Identify and kill long-running queries holding shared MDL: `SHOW FULL PROCESSLIST` → `KILL QUERY <thread_id>` completed
- [ ] For immediate DDL, use `ALTER TABLE ... ALGORITHM=INSTANT, LOCK=NONE` to avoid MDL completed
- [ ] For operations requiring exclusive MDL, schedule during low-traffic windows completed
- [ ] For multi-node coordination, use `SELECT GET_LOCK('migrate_orders', 30)` as an advisory lock completed

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

- [ ] Running ALTER TABLE during active query**: A reporting query holds shared MDL. ALTER waits. All subsequent queries queue. App outage. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Metadata locks checked before migration
- [ ] Long-running blocking queries identified and handled
- [ ] INSTANT algorithm used where possible
- [ ] Advisory lock used for multi-node coordination
- [ ] `lock_wait_timeout` configured for fail-fast
- [ ] No MDL contention during schema migrations
- [ ] Blocking queries are identified and resolved before DDL
- [ ] ALGORITHM=INSTANT avoids MDL where possible
- [ ] Advisory locks coordinate multi-node migration execution
- [ ] `lock_wait_timeout` prevents indefinite blocking

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
- [ ] ### MDL queue cascade prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running ALTER TABLE during active query**: A reporting query holds shared MDL. ALTER waits. All subsequent queries queue. App outage. prevented

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
