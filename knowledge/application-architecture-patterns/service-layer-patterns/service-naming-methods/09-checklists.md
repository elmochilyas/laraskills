# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service class naming conventions and method design
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Inconsistent naming prevented
- [ ] Method name/behavior mismatch prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Name service classes using `{Domain}Service` convention.** Use entity-based names for primary services (`UserService`, `OrderService`) and domain-based names for cross-entity services (`BillingService`, `AuthService`).
- [ ] Workflow step completed: **Name methods using business language.** If the business says "register a user," the method is `register()`. If they say "cancel order," it's `cancelOrder()`. Avoid CRUD terms like `insert()`, `updateStatus()`, `getAll()`.
- [ ] Workflow step completed: **Use consistent method prefix conventions.** Use `create`/`update`/`delete` for CRUD, `process`/`handle`/`execute` for workflows, `find`/`search`/`get` for queries.
- [ ] Workflow step completed: **Maintain one level of abstraction.** Service methods should call other services, actions, and repositories Ã¢â‚¬â€ not low-level `DB::table()` queries. Mixed abstraction levels make methods hard to read.
- [ ] Workflow step completed: **Avoid generic suffixes.** Never use `Manager`, `Helper`, `Utils`, or `Handler` for service classes. These don't communicate architectural role. `UserService` communicates clearly.

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

- [ ] Failure addressed: CRUD-named methods.
- [ ] Failure addressed: Method returning response.
- [ ] Failure addressed: Too many methods.
- [ ] Failure addressed: Generic suffixes.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Service names use `{Domain}Service` convention
- [ ] Method names use business language (not CRUD)
- [ ] Method prefixes are consistent (create/process/find etc.)
- [ ] Methods maintain one level of abstraction
- [ ] No `Manager`/`Helper`/`Utils` suffixes used
- [ ] No service has 30+ methods
- [ ] No service method returns HTTP response

### Success Criteria
- [ ] All service classes use `{Domain}Service` naming consistently.
- [ ] Method names reflect business language, not CRUD terminology.
- [ ] No service has 30+ methods or uses generic suffixes.
- [ ] Methods maintain one abstraction level and never return HTTP responses.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Inconsistent naming
- [ ] Anti-pattern prevented: Method name/behavior mismatch

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: CRUD-named methods.
- [ ] Failure scenario handled: Method returning response.
- [ ] Failure scenario handled: Too many methods.

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
