# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.5 Row-level locks (SELECT ... FOR UPDATE, SKIP LOCKED, NOWAIT)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Job queue with SKIP LOCKED applied
- [ ] Atomic counter with FOR UPDATE applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Missing FOR UPDATE in critical read-update sequences**: Two concurrent requests read the same balance, both add $10, both save. Balance increases by $10 only once. Always lock. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] No race conditions in read-then-write sequences
- [ ] Appropriate lock type chosen (FOR UPDATE vs FOR SHARE)
- [ ] SKIP LOCKED used for job queues

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Job queue with SKIP LOCKED applied
- [ ] Atomic counter with FOR UPDATE applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify the read-then-write sequence that needs protection: completed
- [ ] Use `FOR UPDATE` for exclusive access: completed
- [ ] Use `FOR SHARE` for shared read access (allow other shared reads): completed
- [ ] Use `SKIP LOCKED` for job queues: completed
- [ ] Use `NOWAIT` for fail-fast instead of waiting: completed

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

- [ ] Missing FOR UPDATE in critical read-update sequences**: Two concurrent requests read the same balance, both add $10, both save. Balance increases by $10 only once. Always lock. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All read-then-write sequences use FOR UPDATE or FOR SHARE
- [ ] Transactions with locks are short (< 100ms)
- [ ] SKIP LOCKED or NOWAIT used where waiting is undesirable
- [ ] No FOR UPDATE on read-only queries
- [ ] `lockForUpdate()` inside `DB::transaction()` closure
- [ ] No race conditions in read-then-write sequences
- [ ] Appropriate lock type chosen (FOR UPDATE vs FOR SHARE)
- [ ] SKIP LOCKED used for job queues
- [ ] Locks held for minimum duration (short transactions)
- [ ] No deadlocks from row lock ordering

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
- [ ] Missing FOR UPDATE in read-then-write â€” race condition prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Missing FOR UPDATE in critical read-update sequences**: Two concurrent requests read the same balance, both add $10, both save. Balance increases by $10 only once. Always lock. prevented

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
