# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Multi-tenancy considerations in modular monolith
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Hardcoded tenant strategy globally prevented
- [ ] No tenant isolation tests prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Centralize tenant resolution infrastructure, decentralize tenancy strategy per module.** Create a shared `TenantResolver` service that resolves the current tenant. Each module declares its tenancy strategy independently in its config.
- [ ] Workflow step completed: **Never store tenant context on singleton services.** Under Octane, singletons persist across requests Ã¢â‚¬â€ storing tenant context causes cross-tenant data leaks. Pass tenant context as method parameters instead.
- [ ] Workflow step completed: **Pass tenant context through all cross-module contract calls.** Require tenant ID as a parameter in every contract method operating on tenant-scoped data. The callee uses this context to scope its queries.
- [ ] Workflow step completed: **Include tenant scoping in all query paths.** Use global scopes, repository patterns, or explicit scoping. Architectural tests should verify all queries include tenant scoping.
- [ ] Workflow step completed: **Declare tenancy strategy per module explicitly.** Each module must declare its strategy in its configuration: `database_per_tenant`, `schema_per_tenant`, `column_based`, or `none`. Document the rationale.

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

- [ ] Failure addressed: One tenancy strategy for all modules.
- [ ] Failure addressed: Missing tenant scope in cross-module data access.
- [ ] Failure addressed: Tenant context on singleton services.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Tenancy strategy per module is documented and configurable
- [ ] Tenant context is never stored on singleton services
- [ ] Tenant context is passed through all contract method calls
- [ ] All queries include tenant scoping (global scope, repository, or explicit)
- [ ] `tenant_id` column is indexed in column-based tenancy
- [ ] Tenant isolation tests exist and pass for all modules
- [ ] Cross-tenant modules (logging, reporting) explicitly skip tenant scoping

### Success Criteria
- [ ] Each module declares its tenancy strategy and implements it consistently.
- [ ] Tenant context is passed through all contract calls Ã¢â‚¬â€ never stored on singletons.
- [ ] All tenant-scoped queries include tenant filtering.
- [ ] Tenant isolation tests prevent cross-tenant data leaks.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Hardcoded tenant strategy globally
- [ ] Anti-pattern prevented: No tenant isolation tests

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: One tenancy strategy for all modules.
- [ ] Failure scenario handled: Missing tenant scope in cross-module data access.
- [ ] Failure scenario handled: Tenant context on singleton services.

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
