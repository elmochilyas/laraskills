# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Octane compatibility considerations for layered architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] User data leak prevented
- [ ] Tenant cross-contamination prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Audit every service class for mutable properties: `private $user`, `private $cachedResults`, `public static $currentTenant`, any property set after construction
- [ ] Workflow step completed: Change all `$this->app->singleton()` to `$this->app->bind()` (transient) unless the class is provably stateless with zero mutable properties
- [ ] Workflow step completed: Remove all request-scoped context from constructor/store properties Ã¢â‚¬â€ change `setUser(User $user)` methods to pass `User` as method parameter
- [ ] Workflow step completed: Implement Context Object pattern: create `RequestContext` value object with `user`, `tenantId`, `locale`, `requestId` Ã¢â‚¬â€ pass as single parameter through call chain
- [ ] Workflow step completed: Refactor Domain entities to prefer immutability: behavior methods return new instances instead of mutating existing ones (`markAsPaid()` returns new `Invoice` with updated status)

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

- [ ] Failure addressed: Storing Auth::user() in constructor:
- [ ] Failure addressed: Singletons for everything:
- [ ] Failure addressed: Static state on services:
- [ ] Failure addressed: Silent corruption:
- [ ] Failure addressed: Multi-tenant leaks:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All service classes audited for mutable state Ã¢â‚¬â€ categorized as safe/unsafe
- [ ] `$this->app->bind()` (transient) used by default; singleton only with documented audit
- [ ] Zero service classes store `Auth::user()`, tenant, locale as property
- [ ] Request context passed as method parameters (not via `setUser()`/`setTenant()`)
- [ ] Context Object pattern used for 3+ context values
- [ ] Domain entities prefer immutable behavior (returns new instance, not mutation)
- [ ] Per-request configuration uses factory pattern, not pre-configured singleton
- [ ] Octane-specific test verifies no cross-request data leaks
- [ ] Architecture test prevents mutable state in service classes
- [ ] Stateless pattern documented in project conventions

### Success Criteria
- [ ] Zero singleton-bound services with mutable state (verified by audit + arch tests)
- [ ] Zero service classes storing `User`, tenant, locale, or request ID as instance property
- [ ] Octane concurrency test passes: no cross-request data leak across 100 concurrent requests
- [ ] All request context passed as method parameters, never via `set*()` methods on services
- [ ] Immutable domain entities verified: behavior methods return new instances, not mutations

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: User data leak
- [ ] Anti-pattern prevented: Tenant cross-contamination
- [ ] Anti-pattern prevented: Singleton-as-default

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Storing Auth::user() in constructor:
- [ ] Failure scenario handled: Singletons for everything:
- [ ] Failure scenario handled: Static state on services:

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
