# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.15 Pessimistic locking (sharedLock, lockForUpdate in Eloquent)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read-update cycle with lockForUpdate applied
- [ ] Queue job with lockForUpdate applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Pessimistic locking for read-only operations**: Plain SELECT doesn't need locks. Locks block other transactions unnecessarily. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] `lockForUpdate()` prevents race conditions in read-then-write
- [ ] `sharedLock()` used where shared access is sufficient
- [ ] Transactions with locks are short (< 100ms)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Read-update cycle with lockForUpdate applied
- [ ] Queue job with lockForUpdate applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify the read-then-write sequence that needs protection: completed
- [ ] Use `lockForUpdate()` (exclusive lock): completed
- [ ] Use `sharedLock()` (shared lock): completed
- [ ] Use `SKIP LOCKED` for queue-style processing: completed
- [ ] Always wrap in `DB::transaction()` and keep it short completed

---

# Performance Checklist

- [ ] Performance: Transaction length affects lock contention and MVCC cleanup. PostgreSQL autovacuum must clean dead tuples. Transaction pooling breaks multi-stateme...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Pessimistic locking for read-only operations**: Plain SELECT doesn't need locks. Locks block other transactions unnecessarily. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `lockForUpdate()` used for exclusive read-then-write
- [ ] `sharedLock()` used where shared read is acceptable
- [ ] Always inside `DB::transaction()` closure
- [ ] Transaction kept short (< 100ms)
- [ ] No API calls or external operations inside
- [ ] `lockForUpdate()` prevents race conditions in read-then-write
- [ ] `sharedLock()` used where shared access is sufficient
- [ ] Transactions with locks are short (< 100ms)
- [ ] Deadlock retry handles conflicting locks
- [ ] SKIP LOCKED used for job processing

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Keep Transactions Short prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] `lockForUpdate()` outside transaction â€” lock released immediately (autocommit) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Pessimistic locking for read-only operations**: Plain SELECT doesn't need locks. Locks block other transactions unnecessarily. prevented

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
