# 5-8 Tenant Aware Commands - Decision Trees

## Single-Tenant vs All-Tenant Command Execution

---

## Decision Context

Designing Artisan commands to run either against a single tenant (targeted maintenance) or all tenants (batch operations), controlled by a `--tenant` option.

---

## Decision Criteria

* performance: all-tenant mode processes N tenants sequentially (potentially hours)
* architectural: single-tenant for debugging; all-tenant for deployments
* maintainability: TenantCommand base class with loop abstraction
* security: all-tenant mode must isolate errors per tenant

---

## Decision Tree

How to structure multi-tenant commands?

↓

Command targets a specific tenant?

YES → Use --tenant option (singular mode)

    ↓
    php artisan orders:process --tenant=42
    Resolve single tenant
    Rebind context, run logic
    
    ↓
    Use for: debugging, data backfill for one tenant, targeted maintenance
    Always validate tenant exists

NO → Command targets all tenants (batch mode)?

    YES → No --tenant = batch all tenants
    
        ↓
        $tenants = Tenant::all();
        foreach ($tenants as $tenant) {
            try {
                $this->rebindTenantContext($tenant);
                $this->handleTenant($tenant);
            } catch (\Exception $e) {
                $this->error("Failed tenant {$tenant->id}: {$e->getMessage()}");
                log_failure($tenant->id, $e);
            }
        }
        
        ↓
        Error isolation: one tenant failure doesn't stop others
        Progress bar: $this->output->progressAdvance()
        Batch size: process 10-20 tenants, pause for replication

NO → Need to limit batch to subset?

    → Combine --tenant with --batch option
    --tenant=1,2,3 or --batch=50 (first 50 tenants)
    Gradual rollout — process tenants in waves

---

## Recommended Default

**Default:** TenantCommand base class with singular `--tenant` mode and batch iteration fallback
**Reason:** Singular mode for precision; batch mode for bulk operations. Base class ensures consistent context rebinding and error handling.

---

## Error Handling in Batch Command Execution

---

## Decision Context

Handling failures during multi-tenant batch commands without losing progress or leaving some tenants in inconsistent states.

---

## Decision Criteria

* performance: logging per-tenant failures adds minimal overhead
* architectural: one tenant's failure shouldn't block others
* maintainability: failure report at command end
* security: failed tenants may need manual intervention

---

## Decision Tree

How to handle batch command failures?

↓

Tenant execution fails?

YES → Log tenant + error, continue processing

    ↓
    try {
        $this->handleTenant($tenant);
    } catch (\Exception $e) {
        $this->error("Tenant {$tenant->id}: {$e->getMessage()}");
        $failedTenants[] = ['id' => $tenant->id, 'error' => $e->getMessage()];
    }
    
    ↓
    Continue to next tenant
    DON'T stop mid-batch

NO → Command finished with some failures?

    YES → Print failure summary
    
        ↓
        $this->table(['Tenant ID', 'Error'], $failedTenants);
        Log failures to monitoring system
        Failed tenants may need manual re-run
        
NO → Critical failure (connection to central DB lost)?

    → Stop immediately
    Cannot continue without central DB
    Run: progress already applied tenants; resume not started tenants

---

## Recommended Default

**Default:** Continue on per-tenant errors; print failure summary at end; stop only on critical infrastructure failure
**Reason:** Per-tenant error isolation maximizes throughput. Failure summary enables targeted fixes. Central DB failure is non-recoverable.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant-Aware Commands
* Implement Migration Orchestration Across Tenants
