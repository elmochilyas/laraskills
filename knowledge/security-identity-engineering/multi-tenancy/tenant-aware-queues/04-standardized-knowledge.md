# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | Tenant-Aware Queues and Job Context |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Tenant-aware queues ensure that queue jobs execute in the correct tenant context. When a job is dispatched during a tenant request, the job must carry the `tenant_id` in its serialized payload and restore the tenant context before executing. Without tenant-aware queues, a job may: operate on the wrong tenant's data, fail to scope queries (returning all tenants' data), or leave no audit trail (missing tenant context). This is the most common cross-tenant data leak in multi-tenant Laravel applications.

---

## Core Concepts

- **Tenant Context Serialization**: The `tenant_id` is stored in the job's serialized payload when dispatched via `dispatch()`.
- **Context Restoration**: Restore tenant context at the start of `handle()`: `tenancy()->initialize($this->tenantId)`.
- **Automatic Propagation (stancl/tenancy)**: stancl/tenancy automatically adds tenant ID to job payload and restores context in the queue worker — if configured correctly.
- **Manual Propagation**: Without a package, include a `$tenantId` property in every job class and restore in `handle()`.
- **Failing on Missing Context**: Jobs should fail if tenant context cannot be restored — never process a job without tenant context.

---

## When To Use

- Every multi-tenant Laravel application — any queued job could touch tenant-scoped data
- Jobs sending emails, generating reports, processing uploads, or performing any database operation
- Any job dispatched from a tenant-scoped request or an admin tool switching tenants

## When NOT To Use

- Single-tenant applications (no tenant context needed)
- Jobs that operate on non-tenant data exclusively (rare — most operations touch tenant data eventually)
- Synchronous operations (not queued)

---

## Best Practices

- **Include tenant_id in Every Job**: Every job dispatched from a tenant context must carry the tenant ID.
- **Restore Context at the Start of handle()**: `tenancy()->initialize($this->tenantId)` as the first statement in `handle()`.
- **Fail on Missing Context**: If `$this->tenantId` is null, throw an exception. Never process a job without tenant context.
- **Use stancl/tenancy's Automatic Propagation**: The package handles serialization and restoration automatically when configured correctly.
- **Test Queue Context**: Write tests that verify jobs execute with the correct tenant context and fail without it.

---

## Architecture Guidelines

- stancl/tenancy: jobs dispatched inside a tenant request automatically include tenant ID
- Manual approach: job constructor receives and stores `$tenantId`; `handle()` calls `tenancy()->initialize()`
- Jobs dispatched from admin context (no tenant) should explicitly pass a tenant ID
- Batch jobs: each job in a batch must carry its own tenant context
- Failed jobs: retry should still restore tenant context (stored in serialized payload)

---

## Performance Considerations

- Tenant context restoration: ~1-5ms per job initialization
- No additional load on the queue worker — context is restored per-job
- Serialization overhead: `tenant_id` string in job payload — negligible

---

## Security Considerations

- **Missing Tenant Context = Data Leak**: A job without tenant context runs queries without tenant scoping. Returns ALL tenants' data — or writes to the wrong tenant.
- **Cross-Tenant Contamination**: A job dispatched from a tenant request but processed in a different tenant context operates on wrong data.
- **Job Failure with Wrong Context**: If context restoration fails half-way, partial operations may affect wrong tenants. Use database transactions.
- **Admin Queue Jobs**: Admin-dispatched jobs (e.g., global system maintenance) should explicitly not have tenant context. Document which jobs are intentionally tenant-agnostic.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting tenant_id in job payload | Not including property | Job runs without tenant scope — data leak | Always include tenantId property |
| Not restoring context in handle() | Assuming auto-initialization | Wrong tenant context for DB queries | Initialize tenant as first step in handle() |
| Processing job without context | Silently skipping restoration | Cross-tenant data contamination | Fail the job if context can't be restored |
| Using global state for tenant context | Static property | Context leaks across jobs in same worker | Use serialized payload context |

---

## Anti-Patterns

- **Static/global tenant context**: With queue workers processing multiple jobs, static tenant context spills between jobs
- **Jobs without tenant_id property**: Serialized payload lacks tenant info — context cannot be restored
- **Silently skipping missing context**: Processing data without tenant scoping is a data leak

---

## Examples

**Manual tenant-aware job:**
```php
class ProcessPodcast implements ShouldQueue
{
    public function __construct(
        public Podcast $podcast,
        public ?string $tenantId = null, // Null for tenant-agnostic jobs
    ) {}

    public function handle(): void
    {
        if ($this->tenantId) {
            tenancy()->initialize($this->tenantId);
        }
        
        // All operations are now tenant-scoped
        $this->podcast->process();
    }
}
```

**Dispatched from tenant context:**
```php
// Controller (inside tenant context)
ProcessPodcast::dispatch($podcast, tenancy()->tenantId());
```

**Testing tenant-aware jobs:**
```php
public function test_job_processes_in_correct_tenant(): void
{
    $tenant = Tenant::factory()->create();
    tenancy()->initialize($tenant);
    
    $job = new ProcessPodcast($podcast, $tenant->id);
    $job->handle();
    
    // Assert operations happened in correct tenant
    $this->assertDatabaseHas('podcasts', [
        'id' => $podcast->id,
        'tenant_id' => $tenant->id,
    ]);
}
```

---

## Related Topics

- Multi-tenancy security (global scopes, database isolation)
- Shared database + global scopes
- Database-per-tenant isolation
- stanc/tenancy package architecture

---

## AI Agent Notes

- Tenant-aware queues are the #1 source of cross-tenant data leaks in multi-tenant Laravel apps. Always audit this area.
- If the project uses stancl/tenancy, verify automatic queue context propagation is working correctly.
- For manual implementations, check that EVERY job class has a `$tenantId` property and restores context in `handle()`.

---

## Verification

- [ ] Every queued job includes tenant context (or explicitly marked tenant-agnostic)
- [ ] Tenant context restored at the start of each job's `handle()` method
- [ ] Jobs fail if tenant context cannot be restored
- [ ] stancl/tenancy auto-propagation verified (if using the package)
- [ ] Admin/tenant-agnostic jobs explicitly documented
- [ ] Batch jobs each carry individual tenant context
- [ ] Tests verify jobs process in correct tenant context
- [ ] Failed job retries still restore tenant context
- [ ] No static/global tenant state used in job classes
