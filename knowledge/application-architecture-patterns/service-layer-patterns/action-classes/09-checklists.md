# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Action classes: single-operation-per-class pattern
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Action explosion without organization prevented
- [ ] Giant action prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create one action class per business operation.** Each class has exactly one public method: `execute()` or `handle()`. Name using Verb-Noun pattern: `RegisterUserAction`, `ProcessPaymentAction`.
- [ ] Workflow step completed: **Group actions by domain subdirectory.** Use `app/Actions/User/`, `app/Actions/Billing/`, etc. A flat directory with 100+ action files is unmanageable.
- [ ] Workflow step completed: **Keep actions stateless.** Pass all data as parameters to `execute()`. Never set mutable properties between construction and execution. Stateful actions cause cross-request contamination under Octane.
- [ ] Workflow step completed: **Never call other actions from an action.** Actions are leaf nodes in the call graph. Composition of multiple actions belongs at the Service layer. Action-to-action calls create opaque call graphs.
- [ ] Workflow step completed: **Keep constructor dependencies reasonable.** An action with many dependencies is doing too much. Prefer 1-3 dependencies. Additional concerns should be handled by the service orchestrating this action.

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

- [ ] Failure addressed: Actions calling actions.
- [ ] Failure addressed: Actions with state.
- [ ] Failure addressed: Anemic actions.
- [ ] Failure addressed: Action explosion without organization.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each action has exactly one public method (`execute` or `handle`)
- [ ] Actions don't call other actions (leaf nodes only)
- [ ] Actions are stateless (no mutable properties)
- [ ] Actions are organized by domain subdirectory
- [ ] No anemic actions (logicless model wrappers)
- [ ] No giant action classes (> 100 lines)
- [ ] Constructor dependencies are limited (1-3 typical)

### Success Criteria
- [ ] Each action class has exactly one public method and is organized by domain.
- [ ] Actions are stateless leaf nodes that never call other actions.
- [ ] No anemic or giant actions exist.
- [ ] Service layer orchestrates multiple actions without action-to-action coupling.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Action explosion without organization
- [ ] Anti-pattern prevented: Giant action

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Actions calling actions.
- [ ] Failure scenario handled: Actions with state.
- [ ] Failure scenario handled: Anemic actions.

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
