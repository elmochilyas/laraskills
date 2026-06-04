# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.12 Nested transactions and savepoints (SAVEPOINT, ROLLBACK TO SAVEPOINT)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Partial rollback within a batch applied
- [ ] Service-level transaction composition applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming inner transaction is fully independent**: Inner "commit" doesn't persist data. Only the outer COMMIT persists everything. Understand savepoint semantics. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Nested transactions correctly use savepoints
- [ ] Inner failure rolls back only inner changes
- [ ] Outer commit persists all inner changes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Partial rollback within a batch applied
- [ ] Service-level transaction composition applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Understand savepoint behavior: completed
- [ ] Use nested transactions through service composition: completed
- [ ] For partial rollback in batch processing: completed
- [ ] Check nesting depth: `DB::transactionLevel()` completed

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

- [ ] Assuming inner transaction is fully independent**: Inner "commit" doesn't persist data. Only the outer COMMIT persists everything. Understand savepoint semantics. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Nested transactions use savepoints (Laravel handles this automatically)
- [ ] Inner exception rolls back to savepoint (not entire outer transaction)
- [ ] Only outer COMMIT persists data
- [ ] Transaction level checked if needed
- [ ] Batch processing with partial failure handled correctly
- [ ] Nested transactions correctly use savepoints
- [ ] Inner failure rolls back only inner changes
- [ ] Outer commit persists all inner changes
- [ ] Batch processing handles per-item failures without losing other items' work
- [ ] Composed services work correctly in both nested and standalone mode

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
- [ ] Assuming inner transaction is independent â€” it's a savepoint prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming inner transaction is fully independent**: Inner "commit" doesn't persist data. Only the outer COMMIT persists everything. Understand savepoint semantics. prevented

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
