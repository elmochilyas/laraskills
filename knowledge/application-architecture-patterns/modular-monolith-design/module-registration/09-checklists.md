# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module registration and discovery mechanisms
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Duplicate registration prevented
- [ ] Dead module registered prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Choose the registration mechanism.** Use explicit registration for teams <10 and module count <20. Use auto-discovery for module count >20 or independent module development.
- [ ] Workflow step completed: **For explicit registration, add provider to `config/app.php`.** List each module's service provider in order. Place dependent modules after their dependencies. Document the registration mechanism.
- [ ] Workflow step completed: **For auto-discovery, create `module.json` per module.** Include name, version, dependencies, priority, and enabled/disabled status. The discovery scanner reads this file to register modules.
- [ ] Workflow step completed: **Define module boot order explicitly.** Document priority values or rely on provider ordering. Lower priority = boots first. Dependent modules must boot after their dependencies.
- [ ] Workflow step completed: **Implement `DeferrableProvider` for binding-only providers.** If a module's provider only registers container bindings with no boot-time logic, implement `DeferrableProvider` to reduce boot time.

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

- [ ] Failure addressed: Missing provider registration.
- [ ] Failure addressed: Incorrect boot order.
- [ ] Failure addressed: Duplicate registration.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Registration mechanism (explicit/auto) is chosen and documented
- [ ] Each module has exactly one service provider registered
- [ ] Boot order is defined and documented
- [ ] No duplicate registration exists (both explicit and auto)
- [ ] Dead/orphan modules are deregistered
- [ ] Deferred providers used where applicable
- [ ] Module registration steps are documented for new developers

### Success Criteria
- [ ] Each module's service provider is registered through exactly one mechanism.
- [ ] Module boot order is documented and predictable.
- [ ] No duplicate registration exists.
- [ ] Dead modules are deregistered.
- [ ] New module creation includes registration steps.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Duplicate registration
- [ ] Anti-pattern prevented: Dead module registered

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Missing provider registration.
- [ ] Failure scenario handled: Incorrect boot order.
- [ ] Failure scenario handled: Duplicate registration.

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
