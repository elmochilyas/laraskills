# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.8 Deadlock detection and resolution (innodb_deadlock_detect, wait-for graph)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Deadlock prevention applied
- [ ] Retry on deadlock applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No deadlock retry logic**: `DB::transaction()` fails on deadlock. Transaction is rolled back. Without retry, the operation fails silently. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Deadlock retry logic handles all deadlock errors
- [ ] Retry uses exponential backoff (3 attempts max)
- [ ] Deadlocks are monitored and analyzed

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Deadlock prevention applied
- [ ] Retry on deadlock applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify the deadlock in logs: completed
- [ ] Analyze the deadlock (MySQL): completed
- [ ] Analyze the deadlock (PostgreSQL): completed
- [ ] Implement retry logic in application: completed
- [ ] For MySQL: InnDB automatically chooses the victim (rolls back the transaction with fewest locks) completed

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

- [ ] No deadlock retry logic**: `DB::transaction()` fails on deadlock. Transaction is rolled back. Without retry, the operation fails silently. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Deadlock detection and retry implemented
- [ ] Retry count limited (3-5 attempts)
- [ ] Exponential backoff between retries
- [ ] Deadlock errors analyzed periodically
- [ ] Lock ordering reviewed to prevent frequent deadlocks
- [ ] Deadlock retry logic handles all deadlock errors
- [ ] Retry uses exponential backoff (3 attempts max)
- [ ] Deadlocks are monitored and analyzed
- [ ] No deadlock-related data loss (retried transactions succeed)

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
- [ ] No deadlock retry â€” transaction fails silently prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No deadlock retry logic**: `DB::transaction()` fails on deadlock. Transaction is rolled back. Without retry, the operation fails silently. prevented

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
