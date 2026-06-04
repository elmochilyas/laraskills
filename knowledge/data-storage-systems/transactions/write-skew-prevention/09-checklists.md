# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.18 Write skew prevention (the anomaly that REPEATABLE READ misses)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Explicit range lock applied
- [ ] SERIALIZABLE isolation applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming SELECT + application check + UPDATE is safe**: Concurrent reads see the same state. Both pass the check. Both write. Invariant violated. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Write-skew-prone patterns identified across the application
- [ ] FOR UPDATE or SERIALIZABLE prevents all write skew
- [ ] Invariant holds under concurrent access

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Explicit range lock applied
- [ ] SERIALIZABLE isolation applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify write-skew-prone patterns: completed
- [ ] Fix with explicit range locks (`FOR UPDATE`): completed
- [ ] Fix with SERIALIZABLE isolation (PostgreSQL SSI): completed
- [ ] For capacity management: completed

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

- [ ] Assuming SELECT + application check + UPDATE is safe**: Concurrent reads see the same state. Both pass the check. Both write. Invariant violated. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Write-skew-prone patterns identified and fixed
- [ ] FOR UPDATE locks the rows that determine the invariant
- [ ] SERIALIZABLE (SSI) used if FOR UPDATE scope is unclear
- [ ] Retry logic for SSI serialization failures
- [ ] Invariant verified after fix with concurrent test
- [ ] Write-skew-prone patterns identified across the application
- [ ] FOR UPDATE or SERIALIZABLE prevents all write skew
- [ ] Invariant holds under concurrent access
- [ ] Performance impact of prevention is acceptable
- [ ] SSI retry logic handles < 5% abort rate

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
- [ ] Assuming REPEATABLE READ prevents write skew (it does NOT) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming SELECT + application check + UPDATE is safe**: Concurrent reads see the same state. Both pass the check. Both write. Invariant violated. prevented

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
