# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.25 Tenant bootstrapper pattern (central vs. tenant connections)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Central for cross-tenant ops applied
- [ ] Bootstrapper sequence applied
- [ ] Connection purge on switch applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using same connection for central and tenant data**: Without separation, global queries are tenant-scoped, or tenant queries are global. Two explicit connections prevent confusion. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Central and tenant connections correctly separated
- [ ] Tenant connection switches correctly per request
- [ ] Zero data cross-contamination between central and tenant connections

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Central for cross-tenant ops applied
- [ ] Bootstrapper sequence applied
- [ ] Connection purge on switch applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Define two database connections in `config/database.php`: completed
- [ ] Create `TenantBootstrapper` class: completed
- [ ] Register bootstrapper in service provider or call from middleware completed
- [ ] Use `DB::connection('tenant')` and `DB::connection('central')` explicitly throughout the application completed
- [ ] Set default connection to 'tenant' in `config/database.php`: `'default' => env('DB_CONNECTION', 'tenant')` completed

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

- [ ] Using same connection for central and tenant data**: Without separation, global queries are tenant-scoped, or tenant queries are global. Two explicit connections prevent confusion. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Central connection works without tenant context
- [ ] Tenant connection switches per request
- [ ] `DB::purge('tenant')` called after config change
- [ ] Session variables set on tenant connection
- [ ] Explicit connection usage throughout application
- [ ] Central and tenant connections correctly separated
- [ ] Tenant connection switches correctly per request
- [ ] Zero data cross-contamination between central and tenant connections
- [ ] All models use correct connection automatically
- [ ] Zero accidental central-to-tenant or tenant-to-central queries

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
- [ ] Eloquent models default to wrong connection (not using 'tenant') prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using same connection for central and tenant data**: Without separation, global queries are tenant-scoped, or tenant queries are global. Two explicit connections prevent confusion. prevented

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
