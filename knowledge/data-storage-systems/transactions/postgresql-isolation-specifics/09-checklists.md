# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.3 PostgreSQL isolation specifics (SSI, SERIALIZABLE snapshot isolation, REPEATABLE READ snapshot)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] SSI for financial transactions applied
- [ ] REPEATABLE READ for reporting snapshot applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SSI without retry**: SSI aborts one transaction on conflict. Application must retry. Not handling serialization_failure (40001) causes data loss. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] SSI prevents serialization anomalies without blocking reads
- [ ] Retry logic handles serialization failures gracefully
- [ ] REPEATABLE READ snapshots provide consistent reporting views

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] SSI for financial transactions applied
- [ ] REPEATABLE READ for reporting snapshot applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Choose the isolation level based on needs: completed
- [ ] Set isolation level and run transaction: completed
- [ ] Handle serialization failure (40001): completed
- [ ] For consistent reporting snapshots: completed
- [ ] Monitor `serialization_failure` in PostgreSQL logs completed

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

- [ ] SSI without retry**: SSI aborts one transaction on conflict. Application must retry. Not handling serialization_failure (40001) causes data loss. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SERIALIZABLE used with SSI (PostgreSQL), not pessimistic locking
- [ ] Retry logic implemented for serialization_failure (40001)
- [ ] REPEATABLE READ provides consistent snapshot for reporting
- [ ] No blocking on reads (PostgreSQL MVCC never blocks reads)
- [ ] Serialization failures monitored and within acceptable rate
- [ ] SSI prevents serialization anomalies without blocking reads
- [ ] Retry logic handles serialization failures gracefully
- [ ] REPEATABLE READ snapshots provide consistent reporting views
- [ ] Conflict rate monitored and within acceptable range (< 5%)

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
- [ ] SSI without retry â€” transaction aborts silently, data not persisted prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] SSI without retry**: SSI aborts one transaction on conflict. Application must retry. Not handling serialization_failure (40001) causes data loss. prevented

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
