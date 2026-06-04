# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Bridge/adapter pattern for context boundaries
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Direct dependency prevented
- [ ] Wrong-side adapter prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use a bridge interface for every cross-context synchronous call.** Never directly instantiate or import classes from another context. The consumer depends only on the bridge interface.
- [ ] Workflow step completed: **Place the adapter in the producer context.** The adapter lives in the context that provides the functionality. If the adapter is in the consumer context, the consumer knows both the bridge and the producer's API Ã¢â‚¬â€ defeating the purpose.
- [ ] Workflow step completed: **Define the bridge in a shared kernel.** Place bridge interfaces in a shared directory both contexts depend on. Never define the bridge inside either context Ã¢â‚¬â€ prevents circular dependencies.
- [ ] Workflow step completed: **Use tiered adapters for different environments.** Provide multiple adapter implementations (production, testing). Use a fake adapter in tests, never mock the concrete implementation.
- [ ] Workflow step completed: **Include both data and operations in the bridge contract.** Define both the data DTOs and the allowed operations. A data-only bridge doesn't define how operations are invoked.

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

- [ ] Failure addressed: Skipping the bridge.
- [ ] Failure addressed: Adapter in the consumer context.
- [ ] Failure addressed: Bridge = DTO only.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Cross-context calls use bridge interface, not direct instantiation
- [ ] Adapter lives in the producer context (not consumer)
- [ ] Bridge is defined in a shared location (shared kernel or contracts directory)
- [ ] Laravel service provider binds adapter to bridge
- [ ] Tiered adapters exist for different environments
- [ ] Bridge includes both data DTOs and operation contract

### Success Criteria
- [ ] Every synchronous cross-context call uses a bridge interface Ã¢â‚¬â€ no direct instantiation of another context's classes.
- [ ] Adapter implementations live in the producer context, not the consumer.
- [ ] Bridge interfaces are defined in a shared kernel/contracts directory.
- [ ] Multiple adapter implementations exist for different environments (production fake, testing).
- [ ] Bridge contracts include both data DTOs and operation method signatures.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Direct dependency
- [ ] Anti-pattern prevented: Wrong-side adapter

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Skipping the bridge.
- [ ] Failure scenario handled: Adapter in the consumer context.
- [ ] Failure scenario handled: Bridge = DTO only.

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
