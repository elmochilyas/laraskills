# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.9 Deadlock prevention patterns (consistent lock ordering, index-based locking, shorter transactions)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Ordered lock access applied
- [ ] Batch processing with SKIP LOCKED applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] User interaction within transaction**: "Press OK to confirm purchase" while transaction holds locks. User walks away for 5 minutes. Locks held. Deadlock/FK conflict for other transactions. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Consistent lock ordering across all transactions
- [ ] Transactions complete in < 100ms
- [ ] Deadlock rate reduced to near zero

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Ordered lock access applied
- [ ] Batch processing with SKIP LOCKED applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify all tables/rows locked in each transaction completed
- [ ] Define a global lock order (e.g., always lock user BEFORE order) completed
- [ ] Enforce consistent ordering: completed
- [ ] Keep transactions short — minimize time between first lock and COMMIT: completed
- [ ] Use indexes to narrow lock range: completed

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

- [ ] User interaction within transaction**: "Press OK to confirm purchase" while transaction holds locks. User walks away for 5 minutes. Locks held. Deadlock/FK conflict for other transactions. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Lock order is consistent across all transactions
- [ ] Transactions are short (< 100ms)
- [ ] UPDATE/DELETE queries use indexes on WHERE clause
- [ ] No user interaction within transactions
- [ ] SKIP LOCKED or NOWAIT used where appropriate
- [ ] Consistent lock ordering across all transactions
- [ ] Transactions complete in < 100ms
- [ ] Deadlock rate reduced to near zero
- [ ] Indexes used for all UPDATE/DELETE WHERE clauses
- [ ] SKIP LOCKED used in job processing

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
- [ ] Inconsistent lock order: T1 locks Aâ†’B, T2 locks Bâ†’A â†’ deadlock prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] User interaction within transaction**: "Press OK to confirm purchase" while transaction holds locks. User walks away for 5 minutes. Locks held. Deadlock/FK conflict for other transactions. prevented

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
