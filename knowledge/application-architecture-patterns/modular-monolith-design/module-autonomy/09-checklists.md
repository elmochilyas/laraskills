# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module autonomy: routes, migrations, config, tests per module
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Orphan migrations prevented
- [ ] Duplicate migration names prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Load routes from the module directory.** In the module's service provider `boot()` method, use `$this->loadRoutesFrom(__DIR__ . '/../routes/api.php')`. Never add module routes to the central `routes/` directory.
- [ ] Workflow step completed: **Load migrations from the module directory.** Use `$this->loadMigrationsFrom(__DIR__ . '/../database/migrations')`. Prefix migration filenames with module abbreviation to prevent cross-module name collisions.
- [ ] Workflow step completed: **Load config from the module directory.** Use `$this->mergeConfigFrom(__DIR__ . '/../config/config.php', 'module_name')`. Namespace config keys with the module name to prevent collisions.
- [ ] Workflow step completed: **Load views and translations from the module directory.** Use `$this->loadViewsFrom()` and `$this->loadTranslationsFrom()` for server-rendered UI and i18n.
- [ ] Workflow step completed: **Colocate module tests.** Place all tests in `Modules/{Name}/tests/`. Ensure they can run independently of other modules. Use `vendor/bin/phpunit Modules/{Name}/tests` for per-module test execution.

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

- [ ] Failure addressed: Routes in central file.
- [ ] Failure addressed: Shared migrations directory.
- [ ] Failure addressed: Config key collisions.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Module routes loaded via `loadRoutesFrom()` in provider
- [ ] Module migrations loaded via `loadMigrationsFrom()` in provider
- [ ] Migration filenames include module prefix for uniqueness
- [ ] Module config keys are namespaced to prevent collision
- [ ] Module views/translations loaded from module directory
- [ ] Module tests colocated and independently runnable
- [ ] Migration ordering strategy is documented

### Success Criteria
- [ ] Module routes, migrations, config, views, and tests are all located within the module directory.
- [ ] Service provider loads all module resources from the module directory.
- [ ] Module tests can run independently of other modules.
- [ ] Migration ordering is documented and reliable.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Orphan migrations
- [ ] Anti-pattern prevented: Duplicate migration names

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Routes in central file.
- [ ] Failure scenario handled: Shared migrations directory.
- [ ] Failure scenario handled: Config key collisions.

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
