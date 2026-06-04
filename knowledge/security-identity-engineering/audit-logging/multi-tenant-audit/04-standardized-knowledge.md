# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Multi-tenant Audit Logging |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Multi-tenant audit logging ensures that log entries are isolated per tenant, scoped to the correct actor (tenant-specific user), and auditable without leaking cross-tenant data. Packages like `ahmed3bead/laravel-tenant-audit` extend activity logging with `tenant_id` scoping, polymorphic tenant actor resolution, and per-tenant retention policies. The core challenges: ensuring every log entry carries the correct tenant context (even in queue jobs), preventing cross-tenant log leakage in queries, and managing per-tenant retention policies. A missing tenant context is a cross-tenant data leak in the audit log.

---

## Core Concepts

- **Tenant-Scoped Log**: Every audit entry is tagged with `tenant_id`. Queries are automatically scoped to the current tenant via global scope or explicit condition.
- **Polymorphic Tenant Actor**: The actor (causer) may be a user within a tenant context. The `causer_type`/`causer_id` plus `tenant_id` uniquely identifies who did what.
- **Per-Tenant Retention**: Different tenants may have different retention requirements (enterprise: 7 years, free: 30 days). Retention jobs must filter by `tenant_id`.
- **Queue Context Propagation**: In queue jobs, the tenant context must be restored from serialized job data before logging. Missing tenant context = log entry without tenant = cross-tenant leak risk.

---

## When To Use

- Multi-tenant SaaS applications where audit logs must be isolated per tenant
- Compliance requirements demanding tenant-level audit trail separation
- Applications using shared-database multi-tenancy with activity logging

## When NOT To Use

- Single-tenant applications (unnecessary complexity)
- Applications using database-per-tenant isolation (tenant isolation is inherent)
- Simple audit trails without cross-tenant concerns

---

## Best Practices

- **Global Scope Auto-Scoping**: Add a global scope to the activity log model that automatically filters by `tenant_id`. Set `tenant_id` from `tenancy()->tenantId()` on creation.
- **Queue Context Restoration**: `ShouldQueue` job includes `$tenantId` property. `handle()` calls `tenancy()->initialize($this->tenantId)` before processing.
- **Index tenant_id**: Every query filters by tenant — the column must be indexed.
- **Monitor for null tenant_id**: Any log entry with `tenant_id = NULL` is a potential cross-tenant leak indicator.

---

## Architecture Guidelines

- Add `tenant_id` column to the `activity_log` migration. Index it.
- Global scope for safety (prevent leaks). Explicit `where` for performance-critical queries.
- Shared table with `tenant_id` for 99% of apps. Per-tenant table only when regulatory requirements demand full separation.
- Batch tenants by `retention_days` for retention cleanup, not individually.
- Admin tenant switching tool sets the "impersonated tenant" context, not the admin's own tenant.

---

## Performance Considerations

- `tenant_id` index on activity log table is essential — all queries filter by tenant
- Global scope adds `WHERE tenant_id = ?` to every query — no significant overhead with proper indexing
- Per-tenant retention: batch by retention_days group, not individual tenant queries

---

## Security Considerations

- **Missing Tenant ID = Data Leak**: Log entry with `tenant_id = NULL` is invisible to all tenant views — or visible to all, depending on query scoping. Either way, a security gap.
- **Queue Context**: Every queue job must include and restore `tenant_id`. Missing context logs to wrong (or null) tenant.
- **Admin Queries**: Admin tools must use tenant-scoped queries. Unscoped queries return all tenants' logs — a data leak.
- **Cross-tenant Retention Bug**: A bug in retention job could delete Tenant A's logs instead of Tenant B's. Always use explicit `tenant_id` in retention queries.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not including tenant_id in log queries | Using `ActivityLog::all()` without scope | Returns ALL tenants' logs — data leak | Always scope by tenant_id |
| Forgetting tenant context in queue jobs | Not serializing tenant_id | Entries tagged with null or wrong tenant | Include $tenantId in job payload; restore in handle() |
| Same retention for all tenants | One-size-fits-all policy | Enterprise tenants lose data; free tenants waste storage | Store retention per tenant |
| Not indexing tenant_id | Performance oversight | Full table scan on large log table = disaster | Index tenant_id on activity_log |

---

## Anti-Patterns

- **No global scope — relying on developer discipline**: Inevitable data leak from un-scoped queries
- **Using application DB user for audit writes**: Should not have cross-tenant access
- **Logging outside tenant context**: Queue jobs, CLI commands, and webhooks must all restore tenant context

---

## Examples

**Global scope for tenant isolation:**
```php
// App\Models\ActivityLog
protected static function booted()
{
    static::addGlobalScope('tenant', function (Builder $builder) {
        if (tenancy()->initialized) {
            $builder->where('tenant_id', tenancy()->tenantId());
        }
    });

    static::creating(function ($activityLog) {
        if (tenancy()->initialized) {
            $activityLog->tenant_id = tenancy()->tenantId();
        }
    });
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
        
        activity()
            ->performedOn($this->podcast)
            ->log('Podcast processed');
    }
}
```

---

## Related Topics

- Multi-tenancy security (global scopes, database isolation)
- Spatie laravel-activitylog
- Tenant-aware queues and job context
- Comprehensive audit logging (HMAC, diffs, alerts)

---

## AI Agent Notes

- Multi-tenant audit logging is one of the most commonly misconfigured areas in SaaS Laravel apps. The null tenant_id issue is a frequent finding.
- When auditing a multi-tenant app with activity logging, immediately check for tenant scoping on the activity log model.
- Queue jobs are the weakest link — check that every queued audit operation restores tenant context.

---

## Verification

- [ ] `tenant_id` column on activity log table with index
- [ ] Global scope auto-filters all audit queries by tenant
- [ ] Every audit entry gets `tenant_id` set on creation
- [ ] Queue jobs include and restore `tenant_id`
- [ ] Monitoring/alerting for null `tenant_id` entries
- [ ] Per-tenant retention policies implemented
- [ ] Admin tools use explicit tenant-scoped queries
- [ ] Export filters verify tenant isolation (no cross-tenant data in export)
- [ ] Log retention batch queries use explicit `tenant_id` filter
