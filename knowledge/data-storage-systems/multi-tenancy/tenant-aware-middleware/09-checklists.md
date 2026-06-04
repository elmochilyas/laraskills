# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.6 Tenant-aware middleware (IdentifyTenant, SetTenantConnection)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Singleton CurrentTenant applied
- [ ] Skip middleware for public routes applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Resolving tenant in boot method**: Tenant resolution in `AppServiceProvider::boot()` runs before request context is available. Middleware is the correct place. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Tenant context available in all guarded routes
- [ ] Public routes operate without tenant context
- [ ] Zero middleware-related data leaks in persistent workers

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Singleton CurrentTenant applied
- [ ] Skip middleware for public routes applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create `IdentifyTenant` middleware: extracts tenant identifier, looks up tenant, sets `app(CurrentTenant::class)` completed
- [ ] Create `SetTenantConnection` middleware (for schema/DB-per-tenant): updates `config(['database.connections.tenant.database' => ...])`, calls `DB::p... completed
- [ ] Register middleware in `$middlewarePriority` so `IdentifyTenant` runs before `SetTenantConnection` completed
- [ ] Add middleware to route groups: `->middleware(['tenant']);` completed
- [ ] Exclude public routes (login, register, password reset) from tenant middleware completed

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

- [ ] Resolving tenant in boot method**: Tenant resolution in `AppServiceProvider::boot()` runs before request context is available. Middleware is the correct place. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Tenant resolved before any scoped query runs
- [ ] Connection switching works for all isolation models
- [ ] Public routes work without tenant context
- [ ] Middleware order is correct (IdentifyTenant → SetTenantConnection → StartSession → Authenticate)
- [ ] CurrentTenant accessible via `app(CurrentTenant::class)` anywhere
- [ ] Tenant context available in all guarded routes
- [ ] Public routes operate without tenant context
- [ ] Zero middleware-related data leaks in persistent workers
- [ ] CurrentTenant accessible in any service, controller, or view
- [ ] Zero cross-request data leaks in persistent workers

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
- [ ] Middleware runs after Session/StartSession â€” session depends on tenant DB prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Resolving tenant in boot method**: Tenant resolution in `AppServiceProvider::boot()` runs before request context is available. Middleware is the correct place. prevented

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
