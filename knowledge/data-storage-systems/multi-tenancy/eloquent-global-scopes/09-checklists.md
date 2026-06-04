# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.5 Eloquent global scopes for tenant isolation (bootTraits, addGlobalScope)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] TenantScoped trait applied
- [ ] BelongsToTenant relationship applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Forgetting the scope on new models**: Every new tenant-scoped model must use the trait. One unscoped model = cross-tenant data leak. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Every query on tenant-scoped models includes tenant filter
- [ ] New models automatically get the scope via trait or base class
- [ ] Zero accidental scope bypasses in production

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] TenantScoped trait applied
- [ ] BelongsToTenant relationship applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create `App\Traits\TenantScoped` trait completed
- [ ] In the trait's `boot()`, call `static::addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))` completed
- [ ] Add a `tenant()` relationship method: `return $this->belongsTo(Tenant::class)` completed
- [ ] Apply trait to all tenant-scoped models completed
- [ ] For models with composite tenant keys, customize the scope closure completed

---

# Performance Checklist

- [ ] Performance: Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include ...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Forgetting the scope on new models**: Every new tenant-scoped model must use the trait. One unscoped model = cross-tenant data leak. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All tenant-scoped models have the trait applied
- [ ] Queries include `WHERE tenant_id = ?` (verify with query log)
- [ ] `withoutGlobalScope` calls are documented and limited
- [ ] New models added to the application include the trait
- [ ] Trait applies scope on `boot()`
- [ ] Every query on tenant-scoped models includes tenant filter
- [ ] New models automatically get the scope via trait or base class
- [ ] Zero accidental scope bypasses in production
- [ ] Trait works on any model with a single `use` statement
- [ ] Tenant column configurable, defaults to `tenant_id`

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Never Trust Tenant ID From Request prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] New model created without the trait â€” invisible isolation gap prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Forgetting the scope on new models**: Every new tenant-scoped model must use the trait. One unscoped model = cross-tenant data leak. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
