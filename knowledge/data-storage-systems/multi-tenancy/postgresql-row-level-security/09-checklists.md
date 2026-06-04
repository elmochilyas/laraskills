# Metadata

**Domain:** data-storage-systems
**Subdomain:** multi-tenancy
**Knowledge Unit:** 5.14 PostgreSQL Row-Level Security as defense-in-depth (RLS policies, app.current_tenant)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] RLS + global scope applied
- [ ] Bulk operation bypass applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] RLS without app.current_tenant**: Policy compares against a NULL value — all rows are blocked. Always set the session variable before running queries. prevented
- [ ] RLS on all tables**: RLS has overhead. Apply to tenant-scoped tables only. Tables in the central/public schema should not have RLS. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] RLS blocks all cross-tenant data access at database level
- [ ] Zero performance regression on OLTP queries
- [ ] RLS policies are tested and maintained alongside schema changes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] RLS + global scope applied
- [ ] Bulk operation bypass applied
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed
- [ ] Enable RLS on table: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;` completed
- [ ] Create policy: `CREATE POLICY tenant_isolation ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant')::bigint);` completed
- [ ] For SELECT only: `FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::bigint)` completed
- [ ] Set session variable after connection: `DB::statement("SET app.current_tenant = ?", [$tenantId])` completed
- [ ] Grant table permissions to application role (RLS applies to all roles unless `FORCE ROW LEVEL SECURITY` is off) completed

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

- [ ] RLS without app.current_tenant**: Policy compares against a NULL value — all rows are blocked. Always set the session variable before running queries. prevented
- [ ] RLS on all tables**: RLS has overhead. Apply to tenant-scoped tables only. Tables in the central/public schema should not have RLS. prevented
- [ ] Never Trust Tenant ID From Request followed
- [ ] Always Index Tenant ID As Leading Column followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] RLS enabled on all tenant-scoped tables
- [ ] Policies cover SELECT, INSERT, UPDATE, DELETE
- [ ] Session variable set on every connection
- [ ] Direct SQL cross-tenant access is blocked
- [ ] RLS doesn't break legitimate queries
- [ ] RLS blocks all cross-tenant data access at database level
- [ ] Zero performance regression on OLTP queries
- [ ] RLS policies are tested and maintained alongside schema changes
- [ ] All tenant tables have RLS within 1 minute of creation
- [ ] CI blocks deployment if any tenant table lacks RLS

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
- [ ] RLS policy not created â€” table has RLS enabled but no policy (all rows blocked) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] RLS without app.current_tenant**: Policy compares against a NULL value — all rows are blocked. Always set the session variable before running queries. prevented
- [ ] RLS on all tables**: RLS has overhead. Apply to tenant-scoped tables only. Tables in the central/public schema should not have RLS. prevented

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
