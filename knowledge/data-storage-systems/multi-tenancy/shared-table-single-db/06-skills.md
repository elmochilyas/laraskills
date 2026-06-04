# Skill: Implement Shared-Table Multi-Tenancy

## Purpose

Implement tenant isolation using a single database with a `tenant_id` column and Eloquent global scopes to automatically filter all queries.

## When To Use

- Building a B2B SaaS MVP or early-stage product
- Tenant count is under 10,000 and compliance requirements are minimal
- Lowest operational cost is prioritized over isolation strength

## When NOT To Use

- Compliance (HIPAA, PCI-DSS) mandates physical data separation
- A single tenant's data volume exceeds 50% of total storage
- Team cannot enforce global scope discipline across all models

## Prerequisites

- Laravel application with authentication
- Understanding of Eloquent global scopes
- Knowledge of composite index design

## Inputs

- Tenant resolution mechanism (subdomain, domain, header, auth)
- List of models that must be tenant-scoped

## Workflow (numbered steps)

1. Add `tenant_id` column to all tenant-scoped tables
2. Create a `TenantScoped` trait that applies `addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))`
3. Apply the trait to all tenant-scoped models
4. Create composite indexes with `tenant_id` as the leading column on all scoped queries
5. Implement middleware to resolve current tenant and set it in the service container
6. Write isolation tests that verify Tenant A cannot access Tenant B's data

## Validation Checklist

- [ ] Every tenant-scoped model has `tenant_id` column and global scope
- [ ] Composite indexes have `tenant_id` as leading column
- [ ] Isolation tests pass for all endpoints
- [ ] `withoutGlobalScope` calls are reviewed and documented

## Common Failures

- Missing global scope on a new model exposes all tenants' data
- Index without `tenant_id` as leading column causes full table scans
- Tenant ID accepted from request input enables cross-tenant attack

## Decision Points

- Use trait vs base model for scope application
- Use single global scope vs multiple scopes for complex filtering

## Performance Considerations

- Index `(tenant_id, created_at)` for paginated tenant queries
- Monitor query performance as tenant count grows

## Security Considerations

- Never trust `tenant_id` from user input — resolve from authenticated context
- Audit every `withoutGlobalScope()` call with documented justification

## Related Rules

- 5-1-1: Never Trust Tenant ID From Request
- 5-1-2: Always Index Tenant ID As Leading Column

## Related Skills

- Implement Schema-Per-Tenant Multi-Tenancy
- Implement Database-Per-Tenant Multi-Tenancy
- Implement Tenant-Aware Middleware

## Success Criteria

- All tenant queries include `WHERE tenant_id = ?` automatically
- Cross-tenant data access is impossible through normal application paths
- Index strategy supports tenant-scoped queries at < 10ms for 1M rows per tenant

---

# Skill: Audit Shared-Table Tenant Isolation

## Purpose

Systematically verify that shared-table multi-tenancy isolation is correctly implemented across the entire application.

## When To Use

- Before deploying new features that query tenant-scoped models
- After adding a new model to the application
- As part of regular security audit cycle

## When NOT To Use

- In schema-per-tenant or database-per-tenant architectures (isolation is physical)
- During active development of a feature (audit at feature completion)

## Prerequisites

- Knowledge of all tenant-scoped models
- Access to test data for at least two tenants

## Inputs

- List of all Eloquent models in the application
- Test credentials for two distinct tenants
- Application route list

## Workflow (numbered steps)

1. For each model, verify `tenant_id` column exists and global scope is applied
2. Create overlapping test data for Tenant A and Tenant B
3. For every API endpoint and Artisan command, attempt to access Tenant B's data while authenticated as Tenant A
4. Search codebase for `withoutGlobalScope()` calls and verify each has documented justification
5. Check that all composite indexes have `tenant_id` as the leading column
6. Run `EXPLAIN` on representative tenant queries to verify index usage

## Validation Checklist

- [ ] All models have tenant isolation (verified per model)
- [ ] Isolation tests pass for all endpoints
- [ ] `withoutGlobalScope()` calls are justified and limited
- [ ] Index strategy verified via EXPLAIN

## Common Failures

- New model added without tenant scope — invisible until audit
- Relationship queries bypass global scope on related models

## Decision Points

- Automate isolation tests in CI vs periodic manual audit

## Performance Considerations

- Isolation tests should run on a small dataset for speed
- EXPLAIN verification should target production-like data volume

## Security Considerations

- Document findings in security report
- Create tickets for any isolation gaps found

## Related Rules

- 5-1-1: Never Trust Tenant ID From Request

## Related Skills

- Implement Cross-Tenant Data Leak Prevention
- Implement Without-Global-Scope Guardrails

## Success Criteria

- Zero isolation gaps found across all models and endpoints
- All `withoutGlobalScope()` calls have documented justification
- Index strategy confirmed optimal via EXPLAIN
