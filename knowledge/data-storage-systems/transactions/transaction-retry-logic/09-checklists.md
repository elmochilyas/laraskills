# Metadata

**Domain:** data-storage-systems
**Subdomain:** transactions
**Knowledge Unit:** 9.20 Transaction retry logic (handling serialization failures in application code)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Retry macro applied
- [ ] Transaction middleware applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Infinite retry**: Retrying forever on a deadlock caused by a bug. Always limit retries to 3-5. After max retries, fail and alert. prevented
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Retry wrapper handles all serialization failures
- [ ] Exponential backoff with jitter prevents thundering herd
- [ ] Non-retryable errors propagate immediately

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Retry macro applied
- [ ] Transaction middleware applied
- [ ] Keep Transactions Short followed
- [ ] Always Use DB::transaction Closure followed
- [ ] Prefer Optimistic Locking For Low Contention followed
- [ ] Identify retryable error codes: completed
- [ ] Implement a reusable retry wrapper: completed
- [ ] Use the wrapper in production code: completed
- [ ] Add jitter (±20%) to prevent thundering herd: completed
- [ ] Log retry attempts for monitoring: completed

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

- [ ] Infinite retry**: Retrying forever on a deadlock caused by a bug. Always limit retries to 3-5. After max retries, fail and alert. prevented
- [ ] Always Use DB::transaction Closure followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Retry wrapper implemented for serialization failures
- [ ] Max retry count limited (3-5 attempts)
- [ ] Exponential backoff with jitter
- [ ] Non-retryable errors re-thrown immediately
- [ ] Retry attempts logged for monitoring
- [ ] Retry wrapper handles all serialization failures
- [ ] Exponential backoff with jitter prevents thundering herd
- [ ] Non-retryable errors propagate immediately
- [ ] Retry rate monitored and below acceptable threshold
- [ ] All retried transactions eventually succeed

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
- [ ] Infinite retry loop â€” always set max retry count prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Infinite retry**: Retrying forever on a deadlock caused by a bug. Always limit retries to 3-5. After max retries, fail and alert. prevented

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
