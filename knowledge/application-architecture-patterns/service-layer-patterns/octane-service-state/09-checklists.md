# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service layer in Octane: state management considerations
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] User data leak across requests prevented
- [ ] Tenant cross-contamination prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Pass all request-specific data as method arguments, not service properties.** Store never `$this->user = Auth::user()` on a service. Pass user, tenant, locale as parameters to service methods.
- [ ] Workflow step completed: **Default to transient binding for all services.** Do not explicitly bind business services. The container resolves transient by default. Under Octane, transient prevents state leaks.
- [ ] Workflow step completed: **Use context object pattern for complex request state.** Create a `RequestContext` value object (user, tenant, locale) and pass it to services. This simplifies signatures while keeping request data explicit and avoiding stateful properties.
- [ ] Workflow step completed: **Audit existing services before enabling Octane.** Check for mutable properties, `Auth::user()` or `request()` in constructors, static state that changes per request, and factory closures capturing request state.
- [ ] Workflow step completed: **Ensure no mutable properties on services.** All dependencies should be assigned in the constructor and never reassigned. Mutable properties are the primary source of state leaks under Octane.

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

- [ ] Failure addressed: Assuming Octane doesn't change service behavior.
- [ ] Failure addressed: Storing Auth user in service property.
- [ ] Failure addressed: Singleton for performance without audit.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] No mutable properties on services
- [ ] No captured request context (`Auth::user()` stored on service)
- [ ] All services bound as transient by default
- [ ] Request-specific data passed as method arguments
- [ ] Audit confirms no static state varies per request
- [ ] Context objects used for complex request state
- [ ] No assumption that FPM behavior equals Octane behavior

### Success Criteria
- [ ] All services are stateless Ã¢â‚¬â€ no mutable properties, no captured request context.
- [ ] Request-specific data (user, tenant, locale) is always a method parameter, never a service property.
- [ ] All services use transient binding unless provably stateless with documented audit.
- [ ] Pre-Octane audit checklist is completed confirming no state leaks.
- [ ] Context objects are used for complex request state to avoid parameter bloat.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: User data leak across requests
- [ ] Anti-pattern prevented: Tenant cross-contamination
- [ ] Anti-pattern prevented: Intermittent unreproducible bugs

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Assuming Octane doesn't change service behavior.
- [ ] Failure scenario handled: Storing Auth user in service property.
- [ ] Failure scenario handled: Singleton for performance without audit.

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
