# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.16 Phantom reads vs. non-repeatable reads
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Phantom prevention with range locks applied
- [ ] Snapshot for consistent read (PostgreSQL) applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming REPEATABLE READ prevents all anomalies**: REPEATABLE READ does not prevent serialization anomalies (write skew). Only SERIALIZABLE prevents all. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Non-repeatable reads prevented at REPEATABLE READ or higher
- [ ] Phantom reads prevented at REPEATABLE READ or higher
- [ ] PostgreSQL REPEATABLE READ correctly prevents both

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Phantom prevention with range locks applied
- [ ] Snapshot for consistent read (PostgreSQL) applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify the anomaly type: completed
- [ ] Choose prevention strategy: completed
- [ ] Test with concurrent transactions: completed
- [ ] For MySQL, protect against phantoms with locking reads: completed

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

- [ ] Assuming REPEATABLE READ prevents all anomalies**: REPEATABLE READ does not prevent serialization anomalies (write skew). Only SERIALIZABLE prevents all. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Non-repeatable reads prevented at chosen isolation level
- [ ] Phantom reads prevented at chosen isolation level
- [ ] PostgreSQL REPEATABLE READ prevents both (snapshot isolation)
- [ ] MySQL REPEATABLE READ prevents both (next-key locks for locking reads)
- [ ] SELECT ... FOR UPDATE used where phantom prevention is critical
- [ ] Non-repeatable reads prevented at REPEATABLE READ or higher
- [ ] Phantom reads prevented at REPEATABLE READ or higher
- [ ] PostgreSQL REPEATABLE READ correctly prevents both
- [ ] MySQL REPEATABLE READ with FOR UPDATE prevents phantoms
- [ ] Write skew prevention requires SERIALIZABLE (understood and used when needed)

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
- [ ] Expecting REPEATABLE READ to prevent write skew (it doesn't â€” use SERIALIZABLE) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming REPEATABLE READ prevents all anomalies**: REPEATABLE READ does not prevent serialization anomalies (write skew). Only SERIALIZABLE prevents all. prevented

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
