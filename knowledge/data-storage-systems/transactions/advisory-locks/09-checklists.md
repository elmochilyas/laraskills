# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.7 Advisory locks (application-level coordination via PostgreSQL pg_advisory_lock)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Queue worker coordination applied
- [ ] Rate-limited external API calls applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not unlocking session-level locks**: Session holds the lock until disconnect. If the script dies, lock remains. Prefer transaction-level locks. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Advisory locks acquired and released correctly
- [ ] No lock leaks or deadlocks from advisory locks
- [ ] Transaction-level locks preferred for automatic cleanup

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Queue worker coordination applied
- [ ] Rate-limited external API calls applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Choose advisory lock type: completed
- [ ] For PostgreSQL, prefer transaction-level locks: completed
- [ ] For job coordination (PostgreSQL advisory locks): completed
- [ ] For MySQL `GET_LOCK`: completed
- [ ] Handle lock release: always release in `finally` block to prevent lock leaks completed

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

- [ ] Not unlocking session-level locks**: Session holds the lock until disconnect. If the script dies, lock remains. Prefer transaction-level locks. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Advisory lock acquired before critical section
- [ ] Lock released in `finally` block (not just on success)
- [ ] Transaction-level lock preferred over session-level
- [ ] Non-blocking try-lock used where waiting is undesirable
- [ ] No lock leaks (all acquired locks are released)
- [ ] Advisory locks acquired and released correctly
- [ ] No lock leaks or deadlocks from advisory locks
- [ ] Transaction-level locks preferred for automatic cleanup
- [ ] Coordination achieved without row-level lock escalation

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
- [ ] Session-level lock not released â€” other sessions blocked until disconnect prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not unlocking session-level locks**: Session holds the lock until disconnect. If the script dies, lock remains. Prefer transaction-level locks. prevented

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
