# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.3 Database-per-tenant (separate DB per tenant)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dynamic connection applied
- [ ] Backup per tenant applied
- [ ] Billing alignment applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Creating too many connections**: N tenants = N database connections per PHP-FPM worker. Use a connection pool or limit concurrent tenants per server. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Tenant isolation is physical (separate databases)
- [ ] Dynamic connection switching completes in < 5ms per request
- [ ] Per-tenant backup completes within SLA window

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Dynamic connection applied
- [ ] Backup per tenant applied
- [ ] Billing alignment applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Create a central `tenants` table storing per-tenant database connection details completed
- [ ] Implement provisioning pipeline: create database, run migrations, seed default data completed
- [ ] Configure dynamic connection: `config(['database.connections.tenant.database' => 'tenant_'.$id])` per request completed
- [ ] Call `DB::purge('tenant')` after config change to force reconnection completed
- [ ] Set up connection pooling per tenant or shared pool with database parameter completed

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

- [ ] Creating too many connections**: N tenants = N database connections per PHP-FPM worker. Use a connection pool or limit concurrent tenants per server. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Each tenant's data is in a physically separate database
- [ ] Dynamic connection switching works without stale PDO objects
- [ ] Per-tenant backup and restore tested
- [ ] Connection pooling prevents max_connections exhaustion
- [ ] Database created and migrations applied successfully
- [ ] Tenant isolation is physical (separate databases)
- [ ] Dynamic connection switching completes in < 5ms per request
- [ ] Per-tenant backup completes within SLA window
- [ ] Zero cross-tenant data access possible
- [ ] Tenant database provisioned and available within 10 seconds (sync) or 30 seconds (async)

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
- [ ] Missing `DB::purge()` after config change â€” stale connection to wrong database prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Creating too many connections**: N tenants = N database connections per PHP-FPM worker. Use a connection pool or limit concurrent tenants per server. prevented

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
