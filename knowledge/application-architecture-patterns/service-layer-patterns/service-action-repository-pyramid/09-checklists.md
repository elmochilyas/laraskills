# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service-Action-Repository pyramid architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] All three layers are the same file prevented
- [ ] Pyramid becomes flat prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Establish the call chain: Controller Ã¢â€ â€™ Service Ã¢â€ â€™ Action Ã¢â€ â€™ Repository Ã¢â€ â€™ Database.** Document this convention explicitly. Every developer must know the roles of each layer.
- [ ] Workflow step completed: **Place transaction boundaries in the Service layer only.** The service opens and commits transactions. Actions and repositories must not manage transactions individually.
- [ ] Workflow step completed: **Make Actions leaf nodes Ã¢â‚¬â€ never call other actions.** Services orchestrate multiple actions. Actions only call repositories. Action-to-action calls create opaque call graphs and couple operations.
- [ ] Workflow step completed: **Ensure Services do not do direct data access.** Services call actions or repositories. A service doing `Model::where()` directly couples orchestration to data access.
- [ ] Workflow step completed: **Use Repositories as the abstraction boundary for data access.** Services and actions depend on repository interfaces, not on Eloquent directly. Repository methods return domain objects (models/DTOs), not query builders.

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

- [ ] Failure addressed: Action calling action.
- [ ] Failure addressed: Service doing data access.
- [ ] Failure addressed: Repository returning query builders.
- [ ] Failure addressed: Pyramid becomes flat.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Call chain follows Controller Ã¢â€ â€™ Service Ã¢â€ â€™ Action Ã¢â€ â€™ Repository
- [ ] Actions don't call other actions (leaf nodes)
- [ ] Services orchestrate and manage transactions
- [ ] Services don't do direct data access
- [ ] Repositories return domain objects, not query builders
- [ ] Each layer depends only on the layer below it
- [ ] Transaction boundaries are only at Service layer
- [ ] Action layer is maintained (not atrophied)

### Success Criteria
- [ ] Call chain follows Controller Ã¢â€ â€™ Service Ã¢â€ â€™ Action Ã¢â€ â€™ Repository consistently.
- [ ] Actions are leaf nodes that never call other actions.
- [ ] Services manage transactions and orchestrate without direct data access.
- [ ] Repositories abstract data access and return domain objects.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: All three layers are the same file
- [ ] Anti-pattern prevented: Pyramid becomes flat

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Action calling action.
- [ ] Failure scenario handled: Service doing data access.
- [ ] Failure scenario handled: Repository returning query builders.

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
