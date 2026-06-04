# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-09-service-providers
**Generated:** 2026-06-03
**Based on:** 06
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md, 05-rules.md, 07-decision-trees.md, 08-anti-patterns.md)

---

# Quick Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Production readiness verified

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create a dedicated InfrastructureServiceProvider.** Generate with `php artisan make:provider InfrastructureServiceProvider`. Keep all interface-to-implementation bindings in one place for auditability.
- [ ] Workflow step completed: **Register bindings in `register()` method.** Use `$this->app->bind(Interface::class, Concrete::class)` for instance-per-request or `$this->app->singleton(...)` for shared instances. Add tagged bindings where grouping is needed with `$this->app->tag(...)`.
- [ ] Workflow step completed: **Bind with context where appropriate.** Use contextual binding for specific classes needing different implementations. Example: `$this->app->when(ReportController::class)->needs(ReportGenerator::class)->give(PdfReportGenerator::class)`.
- [ ] Workflow step completed: **Register the provider in `config/app.php`.** Add the Service Provider to the `'providers'` array. Order matters when providers depend on each other.
- [ ] Workflow step completed: **Use interfaces in constructor injection.** Application code should type-hint the interface, not the concrete class. The container resolves through the binding.

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

- [ ] Failure addressed: Binding not registered.
- [ ] Failure addressed: Logic in service providers.
- [ ] Failure addressed: Binding in `boot()` instead of `register()`.
- [ ] Failure addressed: Over-binding.
- [ ] Failure addressed: Forgotten provider registration.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each port interface has a corresponding adapter binding
- [ ] Bindings are registered in `register()`, not `boot()`
- [ ] No constructor injection of interfaces without bindings
- [ ] Contextual bindings are used where appropriate
- [ ] Provider is registered in `config/app.php`
- [ ] Singletons are used only for stateless services
- [ ] No business logic exists in Provider methods

### Success Criteria
- [ ] All port interfaces have corresponding adapter bindings in a central Service Provider.
- [ ] `Target is not instantiable` errors no longer occur for port interfaces.
- [ ] Application code depends on interfaces only, resolved by the container.
- [ ] Provider `register()` method contains only binding declarations, no business logic.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] No known anti-patterns for this KU

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Binding not registered.
- [ ] Failure scenario handled: Logic in service providers.
- [ ] Failure scenario handled: Binding in `boot()` instead of `register()`.

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
