# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.2 Schema-per-tenant (single DB, separate schemas/prefixes per tenant)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Migration per schema applied
- [ ] Search path approach (PostgreSQL) applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Schema-per-tenant on MySQL**: MySQL schemas are equivalent to databases. Schema-per-tenant on MySQL means database-per-tenant. PostgreSQL is the right engine for true schema-per-tenant. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Tenant isolation verified via cross-schema access attempts
- [ ] Migrations can be applied to all schemas in < 5 minutes for 1000 tenants
- [ ] Zero connection overhead for schema switching

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Migration per schema applied
- [ ] Search path approach (PostgreSQL) applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create a central `tenants` table to map tenant IDs to schema names completed
- [ ] For PostgreSQL: `CREATE SCHEMA tenant_{id};` and create tables inside it completed
- [ ] Implement middleware that sets `SET search_path TO tenant_{id};` after connection completed
- [ ] For MySQL: use table prefix `tenant_{id}_` and dynamic table name resolution completed
- [ ] Run migrations per schema: loop tenants, configure connection, run `artisan migrate` completed

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

- [ ] Schema-per-tenant on MySQL**: MySQL schemas are equivalent to databases. Schema-per-tenant on MySQL means database-per-tenant. PostgreSQL is the right engine for true schema-per-tenant. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Each tenant's data is invisible from other tenants' schemas
- [ ] `search_path` is correctly set per request
- [ ] Migrations run successfully across all schemas
- [ ] Connection pooling works with schema switching
- [ ] All tenant schemas are at the target migration version
- [ ] Tenant isolation verified via cross-schema access attempts
- [ ] Migrations can be applied to all schemas in < 5 minutes for 1000 tenants
- [ ] Zero connection overhead for schema switching
- [ ] Zero failed tenant migrations across a deployment
- [ ] Rollback restores only affected tenants

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
- [ ] Search path not reset between requests in persistent worker (Octane) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Schema-per-tenant on MySQL**: MySQL schemas are equivalent to databases. Schema-per-tenant on MySQL means database-per-tenant. PostgreSQL is the right engine for true schema-per-tenant. prevented

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
