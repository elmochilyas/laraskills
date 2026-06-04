# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.4 MySQL InnoDB isolation specifics (REPEATABLE READ, next-key locking, gap locks)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] READ COMMITTED to avoid gap locks applied
- [ ] Indexed queries reduce lock range applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Gap lock deadlock via inserts**: Transaction A locks range (100-200). Transaction B tries to insert id=150. B waits for A's gap lock. If A also needs a resource B holds → deadlock. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Lock contention reduced to acceptable levels
- [ ] Deadlocks from gap locks eliminated
- [ ] Application tolerates READ COMMITTED semantics (phantoms)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] READ COMMITTED to avoid gap locks applied
- [ ] Indexed queries reduce lock range applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Understand InnoDB's REPEATABLE READ locking: completed
- [ ] If gap lock contention is causing deadlocks or reduced concurrency: completed
- [ ] For `SELECT ... FOR UPDATE` at READ COMMITTED: completed
- [ ] Ensure queries use indexes: completed
- [ ] Monitor lock contention: completed

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

- [ ] Gap lock deadlock via inserts**: Transaction A locks range (100-200). Transaction B tries to insert id=150. B waits for A's gap lock. If A also needs a resource B holds → deadlock. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Isolation level set to READ COMMITTED if gap lock contention is high
- [ ] binlog_format = ROW or MIXED (not STATEMENT) for READ COMMITTED
- [ ] Queries use indexes to minimize lock range
- [ ] `SHOW ENGINE INNODB STATUS` shows minimal lock contention
- [ ] No deadlocks caused by gap lock conflicts
- [ ] Lock contention reduced to acceptable levels
- [ ] Deadlocks from gap locks eliminated
- [ ] Application tolerates READ COMMITTED semantics (phantoms)
- [ ] Queries use indexes to minimize lock range

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
- [ ] binlog_format=STATEMENT with READ COMMITTED â€” MySQL prevents this (replication unsafe) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Gap lock deadlock via inserts**: Transaction A locks range (100-200). Transaction B tries to insert id=150. B waits for A's gap lock. If A also needs a resource B holds → deadlock. prevented

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
