# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Transaction boundaries in layered architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Distributed transaction simulation prevented
- [ ] Transaction-per-method in repositories prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Place `DB::transaction()` in the use case method, wrapping all repository calls that must be atomic Ã¢â‚¬â€ never in controllers or repositories
- [ ] Workflow step completed: Perform authorization checks BEFORE the transaction starts Ã¢â‚¬â€ fail fast, avoid holding locks for auth
- [ ] Workflow step completed: Move ALL external API calls (payment gateways, email, HTTP requests) AFTER the transaction commit Ã¢â‚¬â€ API calls cannot be rolled back
- [ ] Workflow step completed: Prevent nested transactions: private methods called within the transaction should NOT wrap their own `DB::transaction()` Ã¢â‚¬â€ they participate in the caller's transaction
- [ ] Workflow step completed: Follow consistent table access ordering within all transactions (e.g., alphabetical order) to prevent deadlocks

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Transactions in controllers:
- [ ] Failure addressed: External API inside transaction:
- [ ] Failure addressed: Nested transactions:
- [ ] Failure addressed: Deadlocks from inconsistent ordering:
- [ ] Failure addressed: Long transactions:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] `DB::transaction()` only in Application layer (use cases/services)
- [ ] No controller or repository manages its own transaction
- [ ] External API calls after transaction commit, never within
- [ ] No nested `DB::transaction()` calls within the same operation
- [ ] Consistent table access ordering across all transactions
- [ ] Authorization performed before transaction, not within
- [ ] Domain events dispatched after commit (via `dispatchAfterCommit` or after-commit callback)
- [ ] Transaction duration monitored and alerted in production
- [ ] Deadlock retry logic implemented for SERIALIZABLE isolation
- [ ] Concurrent transaction test verifies lock behavior

### Success Criteria
- [ ] Zero `DB::transaction()` calls in Controllers or Repositories (verified by arch tests)
- [ ] Zero external API calls inside transaction boundaries
- [ ] Zero nested transaction savepoint confusion
- [ ] No deadlock errors in production (consistent table ordering)
- [ ] Transaction duration p99 <200ms with alerting for outliers

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Distributed transaction simulation
- [ ] Anti-pattern prevented: Transaction-per-method in repositories

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Transactions in controllers:
- [ ] Failure scenario handled: External API inside transaction:
- [ ] Failure scenario handled: Nested transactions:

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
