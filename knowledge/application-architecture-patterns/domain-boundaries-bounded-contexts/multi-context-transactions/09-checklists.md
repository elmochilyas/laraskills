# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Multi-context transactions and saga patterns
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Distributed transaction across contexts prevented
- [ ] Saga without state persistence prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use ACID within a context, Sagas across contexts.** Within a single context, use standard `DB::transaction()`. Use the Saga pattern for operations spanning multiple contexts.
- [ ] Workflow step completed: **Always include compensating transactions for every saga step.** Every step must have a compensating transaction that can undo its effects. Without compensation, a failed step leaves the system inconsistent.
- [ ] Workflow step completed: **Choose choreographed sagas for simple workflows.** Each step publishes an event that triggers the next. Decentralized, good for independent teams. Use for simple linear flows.
- [ ] Workflow step completed: **Choose orchestrated sagas for complex workflows.** Use a central saga manager (coordinator) for workflows with multiple failure paths, branches, parallel steps, or complex compensation logic.
- [ ] Workflow step completed: **Persist saga state for recovery.** Store saga type, status, current step, and payload in a `saga_states` table. In-memory saga state is lost on crash.

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

- [ ] Failure addressed: Using ACID across contexts.
- [ ] Failure addressed: No compensating transactions.
- [ ] Failure addressed: Sagas for single-context operations.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] ACID used within context, Sagas across contexts
- [ ] Compensating transactions exist for each step
- [ ] Saga state is persisted for recovery
- [ ] Choreographed/orchestrated choice is documented
- [ ] No distributed ACID transactions across contexts
- [ ] Compensating transactions are idempotent
- [ ] Outbox pattern ensures reliable event delivery
- [ ] Saga steps have timeouts configured

### Success Criteria
- [ ] ACID transactions used within a single context; Sagas for cross-context operations.
- [ ] Every saga step has an idempotent compensating transaction.
- [ ] Saga state is persisted in database for crash recovery.
- [ ] Choreographed sagas used for simple workflows; orchestrated for complex ones.
- [ ] Outbox pattern guarantees event delivery for saga steps.
- [ ] Saga steps are time-boxed with timeout-based failure detection.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Distributed transaction across contexts
- [ ] Anti-pattern prevented: Saga without state persistence

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Using ACID across contexts.
- [ ] Failure scenario handled: No compensating transactions.
- [ ] Failure scenario handled: Sagas for single-context operations.

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
