# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Formalized contracts between contexts
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Silent contract violation prevented
- [ ] Contract pollution prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Define contracts at every context boundary.** Every communicating pair of bounded contexts needs a formal contract (interface + DTO). Without a contract, changes in one break the other.
- [ ] Workflow step completed: **Use DTOs instead of Eloquent models in contracts.** Never pass Eloquent models across context boundaries. Use readonly DTOs that are independent of the persistence implementation.
- [ ] Workflow step completed: **Version contracts on breaking changes.** When making backward-incompatible changes (removing fields, changing types), increment the version. Multiple versions coexist during migration.
- [ ] Workflow step completed: **Use semantic versioning for contracts.** Major = breaking change, Minor = additive, Patch = bug fix. Consumers pin to a major version and upgrade independently.
- [ ] Workflow step completed: **Contract-test both producer and consumer.** Write shared contract tests that both sides run. Producer verifies it satisfies the contract. Consumer verifies it can work with the contract.

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

- [ ] Failure addressed: No contract.
- [ ] Failure addressed: Contract = implementation.
- [ ] Failure addressed: Backward-incompatible changes without versioning.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Cross-context communication has defined contracts
- [ ] Contracts use DTOs (not Eloquent models)
- [ ] Contracts are versioned
- [ ] Both producer and consumer test against contracts
- [ ] No backward-incompatible changes without version increment
- [ ] DTOs are immutable (readonly)
- [ ] Contracts are lean (minimum fields needed)
- [ ] Contracts placed in shared location

### Success Criteria
- [ ] Every cross-context communication has a formal contract (interface + readonly DTO).
- [ ] No Eloquent model is used in a cross-context contract.
- [ ] Contracts use semantic versioning; breaking changes create new versions.
- [ ] Both producer and consumer run shared contract tests against the same contract definition.
- [ ] Contracts are lean, immutable, and placed in a shared location accessible to both sides.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Silent contract violation
- [ ] Anti-pattern prevented: Contract pollution

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No contract.
- [ ] Failure scenario handled: Contract = implementation.
- [ ] Failure scenario handled: Backward-incompatible changes without versioning.

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
