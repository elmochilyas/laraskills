# Skill: Implement Shared-Database Multi-Tenancy with Global Scopes

## Purpose
Implement shared-database multi-tenancy using Laravel global scopes to automatically filter all queries by the current tenant's ID, ensuring data isolation without per-query `where` clauses.

## When To Use
- SaaS applications sharing one database across tenants
- When DB-per-tenant is too costly or complex
- Tenants with limited data volume that can coexist in shared tables

## When NOT To Use
- Database-per-tenant deployments (isolation at database level)
- Applications where tenant data must be physically separated (compliance)
- Tenants with very large, incompatible data schemas

## Prerequisites
- `tenant_id` column on all shared tables
- Tenant identification mechanism (domain, subdomain, header)
- Global scope applied to tenant-scoped models

## Workflow
1. Add `tenant_id` column to all tenant-scoped database tables
2. Create global scope class: `php artisan make:scope TenantScope`
3. Implement `apply()` method: `$builder->where('tenant_id', tenant()->id())`
4. Register scope in model's `booted()`: `static::addGlobalScope(new TenantScope)`
5. Auto-set `tenant_id` on model creation using model `creating` event
6. Add `tenant_id` to model's `$fillable` (or set automatically in event)
7. For query exceptions: use `withoutGlobalScope()` method (document each usage)
8. Test tenant isolation: create data in tenant A → verify tenant B cannot see it

## Validation Checklist
- [ ] `tenant_id` column on all tenant-scoped tables
- [ ] Global scope applied to all tenant models
- [ ] `tenant_id` auto-set on model creation
- [ ] `withoutGlobalScope()` usage documented and audited
- [ ] Tenant isolation tested with automated tests
- [ ] Index on `tenant_id` for query performance
