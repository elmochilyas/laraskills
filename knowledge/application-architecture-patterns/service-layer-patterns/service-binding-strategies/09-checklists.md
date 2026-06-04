# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service binding strategies: singleton vs. transient
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] User data leak across requests prevented
- [ ] Stale tenant context prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to transient binding for all business services.** Do not explicitly bind Ã¢â‚¬â€ the container resolves a new instance per request (transient) by default. Only explicitly bind when variation is needed (interface-to-implementation mapping).
- [ ] Workflow step completed: **Audit singleton services for statelessness before binding.** Check for mutable properties, captured request context, static state, and request-scoped dependencies. If you cannot prove statelessness, use transient.
- [ ] Workflow step completed: **Use factory pattern for stateful services.** When a service needs request-scoped context (user, tenant), create a context object that is resolved fresh per request via factory, rather than storing state on a singleton.
- [ ] Workflow step completed: **Services must not store mutable request-scoped state.** Pass request-scoped data (authenticated user, current tenant) as method arguments, not as mutable service properties.
- [ ] Workflow step completed: **Under Octane, prefer transient for all business services.** Octane's persistent worker model magnifies the risk of stateful singletons. Transient is safe; singleton requires audit.

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

- [ ] Failure addressed: Singleton for convenience.
- [ ] Failure addressed: Stateful singleton under Octane.
- [ ] Failure addressed: User data leak across requests.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All business services are bound as transient by default
- [ ] Singleton services are audited for statelessness
- [ ] No service stores mutable request-scoped state
- [ ] Under Octane, no stateful singletons exist
- [ ] Factory pattern used where request context is needed
- [ ] No singleton-for-convenience without audit

### Success Criteria
- [ ] All business services use transient binding by default; no explicit binding exists for them.
- [ ] Any singleton bindings are documented with statelessness audit proof.
- [ ] Under Octane, no stateful singletons exist that could leak data across requests.
- [ ] Request-scoped context is passed as method arguments or via factory-created context objects.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: User data leak across requests
- [ ] Anti-pattern prevented: Stale tenant context

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Singleton for convenience.
- [ ] Failure scenario handled: Stateful singleton under Octane.
- [ ] Failure scenario handled: User data leak across requests.

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
