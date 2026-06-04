# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.17 Serializable Snapshot Isolation (PostgreSQL SSI, conflict detection)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] SSI for inventory management applied
- [ ] SSI with retry wrapper applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SSI without understanding conflict rate**: SSI overhead increases with conflict rate. Monitor `serialization_failures` in pg_stat_database. High rate → reduce SSI scope. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] SSI prevents all serialization anomalies without blocking reads
- [ ] Retry logic handles serialization failures gracefully
- [ ] Serialization failure rate < 5% (acceptable)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] SSI for inventory management applied
- [ ] SSI with retry wrapper applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Set isolation level to SERIALIZABLE (SSI): completed
- [ ] Implement retry wrapper in Laravel: completed
- [ ] Use for write-skew-prone operations: completed
- [ ] Monitor serialization failures: completed
- [ ] Keep transactions short — SSI conflict probability increases with transaction duration completed

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

- [ ] SSI without understanding conflict rate**: SSI overhead increases with conflict rate. Monitor `serialization_failures` in pg_stat_database. High rate → reduce SSI scope. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SERIALIZABLE isolation set on the transaction
- [ ] Retry logic handles serialization_failure (40001)
- [ ] Exponential backoff between retries
- [ ] Transaction is short (< 100ms)
- [ ] SSI conflict rate monitored (< 5% abort rate)
- [ ] SSI prevents all serialization anomalies without blocking reads
- [ ] Retry logic handles serialization failures gracefully
- [ ] Serialization failure rate < 5% (acceptable)
- [ ] Transactions with SSI are short (< 100ms)
- [ ] SSI used only where needed (not globally)

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
- [ ] SSI without retry â€” transaction silently fails, data not persisted prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] SSI without understanding conflict rate**: SSI overhead increases with conflict rate. Monitor `serialization_failures` in pg_stat_database. High rate → reduce SSI scope. prevented

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
