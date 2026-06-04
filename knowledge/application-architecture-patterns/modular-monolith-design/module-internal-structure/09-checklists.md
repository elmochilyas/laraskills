# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module internal structure conventions
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Module structure abandonment prevented
- [ ] Missing module boundary enforcement prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create the standard module directory structure.** Scaffold `src/Contracts/`, `src/Models/`, `src/Services/`, `src/Actions/`, `src/Events/`, `src/Providers/`, `src/routes/`, `database/migrations/`, `config/`, `tests/`. Maintain consistency across all modules.
- [ ] Workflow step completed: **Define Contracts/ as the public face of the module.** Place all inter-module communication interfaces in Contracts/. Other modules may ONLY import from Contracts/. Use `@internal` docblocks or PHP 8 `#[Internal]` attributes for non-public classes.
- [ ] Workflow step completed: **Assign a top-level namespace per module.** Use `Modules\{ModuleName}` namespace for all classes. This prevents class collisions and enables namespace-based static analysis enforcement.
- [ ] Workflow step completed: **Create exactly one service provider per module.** The provider handles bindings (register) and routes/migrations/events (boot). Register it in `config/app.php`.
- [ ] Workflow step completed: **Place routes, migrations, config inside the module.** Load them from the provider using `loadRoutesFrom()`, `loadMigrationsFrom()`, `mergeConfigFrom()`. Never put module routes in central route files.

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

- [ ] Failure addressed: Inconsistent structure across modules.
- [ ] Failure addressed: Internal classes imported from other modules.
- [ ] Failure addressed: Empty contracts.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All modules follow the same internal structure convention
- [ ] Contracts/ is the only directory imported from other modules
- [ ] Each module has exactly one service provider
- [ ] Module has own top-level namespace
- [ ] Routes, migrations, config are in module directory
- [ ] Module tests are colocated
- [ ] `@internal` markers on non-public API classes
- [ ] Contracts/ exposes only what other modules need

### Success Criteria
- [ ] Every module follows the identical directory structure.
- [ ] Contracts/ is the only cross-module import boundary.
- [ ] Each module has one service provider and a distinct namespace.
- [ ] Colocated tests enable per-module CI execution.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Module structure abandonment
- [ ] Anti-pattern prevented: Missing module boundary enforcement

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Inconsistent structure across modules.
- [ ] Failure scenario handled: Internal classes imported from other modules.
- [ ] Failure scenario handled: Empty contracts.

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
