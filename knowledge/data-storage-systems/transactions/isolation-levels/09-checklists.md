# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.2 Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] READ COMMITTED for most production workloads applied
- [ ] REPEATABLE READ for strict consistency applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using SERIALIZABLE "for safety"**: SERIALIZABLE significantly reduces throughput (more conflicts, retries). Use only when anomalies at REPEATABLE READ-level are unacceptable. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Isolation level prevents required anomalies
- [ ] Throughput meets performance requirements
- [ ] No unnecessary SERIALIZABLE usage

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] READ COMMITTED for most production workloads applied
- [ ] REPEATABLE READ for strict consistency applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Understand the four isolation levels and what they prevent: completed
- [ ] Choose the minimal level that prevents your acceptance anomalies: completed
- [ ] Set isolation level at the session/transaction: completed
- [ ] In Laravel, set per-connection in `config/database.php`: completed
- [ ] Test with concurrent transactions to verify anomalies are prevented completed

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

- [ ] Using SERIALIZABLE "for safety"**: SERIALIZABLE significantly reduces throughput (more conflicts, retries). Use only when anomalies at REPEATABLE READ-level are unacceptable. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Isolation level chosen prevents acceptance anomalies
- [ ] Level set correctly in database config
- [ ] Higher isolation not used unnecessarily (avoids throughput reduction)
- [ ] SERIALIZABLE used only when write skew or serialization anomalies must be prevented
- [ ] Application handles serialization failures with retry (SERIALIZABLE, SSI)
- [ ] Isolation level prevents required anomalies
- [ ] Throughput meets performance requirements
- [ ] No unnecessary SERIALIZABLE usage
- [ ] Serialization failures handled with retry logic

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
- [ ] Using SERIALIZABLE for all transactions "for safety" â€” kills throughput prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using SERIALIZABLE "for safety"**: SERIALIZABLE significantly reduces throughput (more conflicts, retries). Use only when anomalies at REPEATABLE READ-level are unacceptable. prevented

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
