# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.10 Lock wait timeout (innodb_lock_wait_timeout, deadlock_timeout, lock_timeout)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Lower timeout for interactive queries applied
- [ ] Higher timeout for batch jobs applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Default 50s timeout for web requests**: If a lock is held, the web request waits 50s before failing. User sees a 50s timeout. Lower to 5-10s. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Lock wait timeout set appropriately for workload type
- [ ] Interactive queries fail fast (< 10s) on lock contention
- [ ] Batch jobs use longer timeout (30-60s)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Lower timeout for interactive queries applied
- [ ] Higher timeout for batch jobs applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Evaluate workload requirements: completed
- [ ] Set MySQL timeout: completed
- [ ] Set PostgreSQL timeout: completed
- [ ] In Laravel, set per-connection: completed
- [ ] Monitor lock wait timeout errors: completed

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

- [ ] Default 50s timeout for web requests**: If a lock is held, the web request waits 50s before failing. User sees a 50s timeout. Lower to 5-10s. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `innodb_lock_wait_timeout` set to 5-10s for web requests
- [ ] `lock_timeout` set for PostgreSQL transactions
- [ ] Batch jobs use separate connection with higher timeout
- [ ] Lock wait errors are monitored and below acceptable rate
- [ ] Application handles lock wait timeout errors gracefully
- [ ] Lock wait timeout set appropriately for workload type
- [ ] Interactive queries fail fast (< 10s) on lock contention
- [ ] Batch jobs use longer timeout (30-60s)
- [ ] Application handles lock wait timeout errors with retry or graceful failure

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
- [ ] Default 50s timeout for web requests â€” user waits 50s before error prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Default 50s timeout for web requests**: If a lock is held, the web request waits 50s before failing. User sees a 50s timeout. Lower to 5-10s. prevented

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
