# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Dependency injection for services and actions
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Circular dependency prevented
- [ ] Resolution failure prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use constructor injection for all required dependencies.** Declare dependencies as constructor parameters with `private`/`protected`/`public` visibility. The container resolves automatically. Do not use `app()`, service locator, or facades in services.
- [ ] Workflow step completed: **Depend on interfaces, not concrete classes, at variation points.** When a service may need alternative implementations (payment gateways, notification channels), depend on an interface and bind the implementation in a service provider.
- [ ] Workflow step completed: **Avoid facades in injected services.** Replace `\Cache::get()`, `\Log::info()`, and other facades with injected contracts. Facades hide dependencies and make testing harder.
- [ ] Workflow step completed: **Monitor for 5+ constructor dependencies.** Five or more constructor parameters signals the class is doing too much. Extract related behavior into separate services.
- [ ] Workflow step completed: **Perform no work in constructors.** Constructors must only assign parameters. No logic, no external API calls, no database queries, no event dispatching.

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

- [ ] Failure addressed: Facade usage in services.
- [ ] Failure addressed: Constructor work.
- [ ] Failure addressed: Too many interfaces.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Constructor injection is used for all required dependencies
- [ ] Services depend on interfaces at variation points (not concrete classes)
- [ ] No facades used in services/actions
- [ ] No class has 5+ constructor dependencies
- [ ] No constructor performs logic (only assignment)
- [ ] Interfaces exist only where variation is needed
- [ ] No circular dependencies exist

### Success Criteria
- [ ] All services and actions use constructor injection with no facades or service locator calls.
- [ ] Interfaces exist only at true variation points, not for every service.
- [ ] No class has 5+ constructor dependencies or performs work in the constructor.
- [ ] No circular dependencies exist between services.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Circular dependency
- [ ] Anti-pattern prevented: Resolution failure

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Facade usage in services.
- [ ] Failure scenario handled: Constructor work.
- [ ] Failure scenario handled: Too many interfaces.

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
