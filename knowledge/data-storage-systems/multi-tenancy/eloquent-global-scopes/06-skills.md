# Skill: Implement Eloquent Global Scopes for Tenant Isolation

## Purpose

Automatically scope all Eloquent queries to the current tenant using `addGlobalScope`, preventing accidental cross-tenant data access.

## When To Use

- Shared-table multi-tenancy model
- Any model where every query must filter by tenant
- As a foundational isolation layer (even with schema/DB-per-tenant for app-level safety)

## When NOT To Use

- Models that store cross-tenant reference data (countries, currencies)
- Admin-only models where all data is visible
- Schema-per-tenant or DB-per-tenant where physical isolation suffices

## Prerequisites

- Tenant resolution middleware
- `tenant_id` column on all scoped models
- Understanding of Eloquent global scopes and `withoutGlobalScope`

## Inputs

- List of all tenant-scoped models
- Current tenant resolver function
- `TenantScoped` trait definition

## Workflow (numbered steps)

1. Create `App\Traits\TenantScoped` trait
2. In the trait's `boot()`, call `static::addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))`
3. Add a `tenant()` relationship method: `return $this->belongsTo(Tenant::class)`
4. Apply trait to all tenant-scoped models
5. For models with composite tenant keys, customize the scope closure
6. Test that all queries include `WHERE tenant_id = ?` via `DB::listen` or query log

## Validation Checklist

- [ ] All tenant-scoped models have the trait applied
- [ ] Queries include `WHERE tenant_id = ?` (verify with query log)
- [ ] `withoutGlobalScope` calls are documented and limited
- [ ] New models added to the application include the trait

## Common Failures

- New model created without the trait — invisible isolation gap
- `withoutGlobalScope` used in user-facing features — data leak
- Scope applies `WHERE tenant_id IS NULL` when tenant ID is zero — leak

## Decision Points

- Trait vs base `Model` class for scope application
- Single scope vs multiple named scopes for complex filtering

## Performance Considerations

- Global scope adds a WHERE clause to every query — negligible cost
- Ensure `tenant_id` is indexed (leading column in composite indexes)

## Security Considerations

- Treat `withoutGlobalScope` as a privileged operation
- Add code review requirement for any scope bypass

## Related Rules

- 5-5-1: Always Apply Tenant Scope To All Models
- 5-5-2: Never Bypass Scope Without Justification

## Related Skills

- Implement Without-Global-Scope Guardrails
- Implement Cross-Tenant Data Leak Prevention
- Implement PostgreSQL Row-Level Security

## Success Criteria

- Every query on tenant-scoped models includes tenant filter
- New models automatically get the scope via trait or base class
- Zero accidental scope bypasses in production

---

# Skill: Create a Reusable TenantScoped Trait

## Purpose

Encapsulate tenant scoping logic in a reusable trait that can be applied to any model, ensuring consistent isolation behavior.

## When To Use

- More than 2 models need tenant scoping
- Team needs consistent scope behavior across features
- Scope logic may evolve (e.g., multi-tenant key support)

## When NOT To Use

- Only 1 model is tenant-scoped (direct scope is simpler)
- Different models need fundamentally different scoping rules

## Prerequisites

- Existing global scope implementation
- Understanding of PHP traits and Eloquent boot method

## Inputs

- Tenant ID column name (default: `tenant_id`)
- Current tenant resolver function

## Workflow (numbered steps)

1. Define trait with properties: `$tenantColumn`, `$scopeName`
2. In `bootTenantScoped()`, register global scope
3. Add method `scopeForTenant($query, $tenant)` for manual filtering
4. Add helper `isTenantScoped(): bool` for runtime checks
5. Add method `getTenantColumn(): string` for dynamic column reference
6. Document usage: `use App\Traits\TenantScoped;`

## Validation Checklist

- [ ] Trait applies scope on `boot()`
- [ ] Scope uses configurable tenant ID column
- [ ] Manual scope method works for alternative filtering

## Common Failures

- Trait conflict with other boot methods (use `bootTraitName` naming)
- Scope closure captures stale tenant context

## Decision Points

- Trait vs abstract base Model class
- Configurable tenant column vs hardcoded

## Performance Considerations

- No runtime overhead beyond the global scope WHERE clause

## Security Considerations

- Trait must not expose methods that bypass scope

## Related Rules

- 5-5-1: Always Apply Tenant Scope To All Models

## Related Skills

- Implement Shared-Table Multi-Tenancy

## Success Criteria

- Trait works on any model with a single `use` statement
- Tenant column configurable, defaults to `tenant_id`
- Manual scoping method available for edge cases
