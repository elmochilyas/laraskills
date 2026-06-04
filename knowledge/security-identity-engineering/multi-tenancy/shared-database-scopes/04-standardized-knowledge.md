# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | Shared Database + Global Eloquent Scopes |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Shared database multi-tenancy uses a single database with a `tenant_id` column on every tenant-scoped table. Global Eloquent scopes automatically add `WHERE tenant_id = ?` to every query, preventing accidental cross-tenant data leaks. This is the simplest and most common multi-tenancy pattern, suitable for 90%+ of SaaS applications. It offers operational simplicity (single database, easy migrations, simple backups) at the cost of row-level data isolation — a `->withoutGlobalScopes()` call or direct DB query can bypass tenant isolation.

---

## Core Concepts

- **`tenant_id` Column**: Every tenant-scoped table includes a `tenant_id` foreign key column.
- **Global Scope**: An Eloquent global scope that adds `where tenant_id = {current_tenant}` to all queries on tenant-scoped models.
- **BelongsToTenant Trait**: A reusable trait that applies the global scope and auto-fills `tenant_id` on create.
- **Tenant Resolution**: Middleware determines the current tenant from subdomain, domain, header, or authenticated user.
- **Scope Bypass Risk**: `withoutGlobalScopes()`, direct DB queries (`DB::table()`), and joins can bypass tenant scoping.

---

## When To Use

- Multi-tenant SaaS applications with moderate isolation requirements
- Operational simplicity (single database, shared migrations, simple backups)
- Starting point for multi-tenancy — migrate to schema-per-tenant only if scale/regulation demands it
- 90%+ of multi-tenant use cases

## When NOT To Use

- Strict compliance requiring database-level isolation (HIPAA, PCI DSS) — use separate databases
- Tenants with very large, separate datasets — shared schema grows without tenant-level partitioning
- When schema-per-tenant features are needed (different indexes, different configurations per tenant)

---

## Best Practices

- **Global Scope Auto-Enforcement**: Always apply global scopes via trait. Never rely on manual `->where('tenant_id', ...)` calls.
- **Composite Unique Indexes**: Include `tenant_id` in all unique indexes. Prevents cross-tenant ID collisions.
- **UUIDs Over Auto-Increment IDs**: Reduces risk of tenant ID leaks through sequential IDs.
- **Middleware-Based Tenant Resolution**: Resolve tenant in middleware at the start of the request cycle.
- **Queue Context Restoration**: Every job must carry `tenant_id` and restore tenant context in `handle()`.

---

## Architecture Guidelines

- `BelongsToTenant` trait: adds global scope, auto-fills `tenant_id` on create
- Tenant resolution: middleware checks subdomain, authenticated user's tenant, or header
- Queue jobs: include `$tenantId` property; call `tenancy()->initialize($this->tenantId)` in `handle()`
- Admin bypass: `Model::withoutGlobalScopes()` for admin tools — minimal and audited usage
- Foreign keys: use `tenant_id` as FK in all tenant-scoped tables

---

## Performance Considerations

- Global scope adds `WHERE tenant_id = ?` to every query — negligible with index
- `tenant_id` index is essential on every tenant-scoped table
- Shared table means all tenants' data in one table — partition by `tenant_id` for large datasets
- Composite indexes must include `tenant_id` as the first column for query efficiency

---

## Security Considerations

- **Scope Bypass**: `withoutGlobalScopes()` and raw DB queries bypass Eloquent scoping. Audit all uses.
- **Cross-Tenant Leak**: Missing `tenant_id` in a query returns ALL tenants' data — a data leak.
- **Queue Jobs**: Forgetting to restore tenant context in queue jobs is the most common cross-tenant leak.
- **Admin Tools**: Admin user switching tenants must set the correct tenant context, not use the admin's own tenant.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not using global scopes | Relying on manual where() calls | Missing tenant_id in some queries = data leak | Always use global scope trait |
| Not including tenant_id in unique indexes | Default unique constraint without tenant | Duplicate key errors across tenants | Composite unique: (tenant_id, column) |
| Forgetting tenant context in queue jobs | Not serializing tenant_id | Logs/data assigned to wrong tenant | Include tenantId in job; restore in handle() |
| Using auto-increment IDs | Convenience | Sequential IDs leak tenant data across tenants | Use UUIDs |

---

## Anti-Patterns

- **Manual `->where('tenant_id', ...)` everywhere**: Inevitably missed in some queries — use global scopes
- **Storing tenant_id in session only**: Queue jobs and other processes need tenant context outside the HTTP session
- **No composite unique indexes**: Cross-tenant unique constraint conflicts

---

## Examples

**BelongsToTenant trait:**
```php
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (tenancy()->initialized()) {
                $builder->where('tenant_id', tenancy()->tenantId());
            }
        });

        static::creating(function ($model) {
            if (tenancy()->initialized()) {
                $model->tenant_id = tenancy()->tenantId();
            }
        });
    }
}
```

**Tenant middleware:**
```php
// app/Http/Middleware/InitializeTenancy.php
public function handle(Request $request, Closure $next): Response
{
    $tenant = Tenant::findByDomain($request->getHost());
    tenancy()->initialize($tenant);
    
    return $next($request);
}
```

**Queue job with tenant context:**
```php
class ProcessPodcast implements ShouldQueue
{
    public function __construct(
        public Podcast $podcast,
        public string $tenantId,
    ) {}

    public function handle(): void
    {
        tenancy()->initialize($this->tenantId);
        // Process podcast — all queries are tenant-scoped
    }
}
```

---

## Related Topics

- Database-per-tenant isolation pattern
- stanc/tenancy package architecture
- Tenant-aware queues and job context
- Multi-tenancy security testing

---

## AI Agent Notes

- Shared DB + global scopes is the default multi-tenancy pattern. Check for proper global scope enforcement, not manual where() calls.
- The most common vulnerability: missing tenant context in queue jobs.
- UUIDs over auto-increment is strongly recommended for cross-tenant leak prevention.

---

## Verification

- [ ] Global scope trait applied to all tenant-scoped models
- [ ] `tenant_id` column exists on all tenant-scoped tables with index
- [ ] Composite unique indexes include `tenant_id`
- [ ] UUIDs used for primary keys (preferred over auto-increment)
- [ ] Tenant resolution middleware correctly identifies current tenant
- [ ] Queue jobs include and restore `tenant_id`
- [ ] `withoutGlobalScopes()` usage audited and minimal
- [ ] Foreign keys include `tenant_id` where appropriate
- [ ] Cross-tenant CI tests exist for every model
