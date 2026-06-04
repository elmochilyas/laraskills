# 5-10 Tenant Provisioning Lifecycle - Decision Trees

## Synchronous vs Asynchronous Provisioning

---

## Decision Context

Choosing between synchronous provisioning (user waits for setup) and asynchronous provisioning (queued jobs) when a new tenant signs up.

---

## Decision Criteria

* performance: sync provisioning may take 5-30s; async returns in <1s
* architectural: async requires queue worker and tenant state tracking
* maintainability: async is more complex but provides better UX
* security: provisioning jobs must run with elevated privileges

---

## Decision Tree

How to provision new tenants?

↓

Self-service signup with expected <1s response?

YES → Use async provisioning (queued job chain)

    ↓
    1. Create tenant record in central DB (status=provisioning)
    2. Dispatch CreateTenantJob → RunMigrationsJob → SeedDefaultsJob
    3. Return "setting up your workspace" with setup progress
    
    ↓
    User redirected to a setup status page
    On completion: status=active, send welcome email
    On failure: status=failed, email admin
    
    ↓
    Each step is a separate queued job
    Failed step retries 3× then marks tenant failed

NO → Admin-created tenants (back-office)?

    YES → Sync or async — both acceptable
        
        ↓
        Admin sees progress bar for sync
        Async with notification when done
        Admin patience is higher than end-user

NO → Bulk import (many tenants at once)?

    → Async batch with throttling
    Process 10-20 tenants per batch
    Monitor: queue depth, success rate, error rate

---

## Recommended Default

**Default:** Async provisioning via queued job chain for self-service; sync for admin back-office
**Reason:** Self-service users expect instant signup. Admin tools can wait for completion. Async prevents request timeouts during migration-heavy provisioning.

---

## Deactivation vs Archival vs Deletion

---

## Decision Context

Choosing the right tenant decommissioning strategy based on reactivation likelihood, compliance requirements, and data retention policies.

---

## Decision Criteria

* performance: deactivation is instant; archival takes seconds to minutes
* architectural: soft-delete enables reactivation; hard-delete is permanent
* maintainability: archival requires cold storage export pipeline
* security: deleted data must be irrecoverable after grace period

---

## Decision Tree

Tenant needs to be removed?

↓

Tenant likely to return (trial expired, payment failed)?

YES → Soft-deactivate (set active=false)

    ↓
    Mark tenant as inactive in central DB
    App rejects requests for inactive tenants
    Data remains in database — reactivation is instant
    Billing: stop charges, retain data for 90 days

NO → Tenant requested permanent deletion?

    YES → Offer 30-day grace period

        ↓
        Day 0-30: Soft-deactivate, data accessible for re-activation
        Day 30: Archive data to cold storage (S3 Glacier, etc.)
        Day 90: Delete archived data (or retain per compliance)
        
        ↓
        Export data for tenant before deletion
        Document deletion in audit log
        
    NO → Compliance requires immediate deletion (GDPR)?
    
        → Immediate permanent deletion
        Drop schema/database or delete rows
        Confirm: "This cannot be undone"
        No grace period — legal requirement

---

## Recommended Default

**Default:** Soft-deactivate (30 days) → archive (60 days) → delete (90 days)
**Reason:** Grace period prevents accidental data loss. Archival enables reactivation if needed. Compliance exceptions handle immediate deletion requirements.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Provisioning Lifecycle
* Implement Tenant-Aware Queue Jobs
