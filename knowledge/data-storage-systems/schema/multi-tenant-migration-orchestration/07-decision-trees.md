# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-21 Multi-Tenant Migration Orchestration
**Generated:** 2026-06-03

---

# Decision Inventory

* Sequential vs parallel vs queued fan-out
* Canary rollout strategy for tenant migrations
* Error isolation and failure handling

---

# Architecture-Level Decision Trees

---

## Tenant Migration Fan-Out Strategy

---

## Decision Context

Choosing the deployment strategy for running migrations across hundreds to thousands of tenant databases.

---

## Decision Criteria

* performance: sequential is slow (~17h for 1000 tenants); queued is fastest
* architectural: each tenant migration must be isolated in its own transaction
* maintainability: queued approach provides built-in retry and failure handling
* security: tenant data isolation must be maintained during migration

---

## Decision Tree

Running migrations across N tenant databases?
↓
Is N < 50?
YES → Sequential fan-out is acceptable (simple, low complexity)
NO → Use queued fan-out (dispatch migration job per tenant)
    ↓
    Canary rollout needed?
    YES → Migrate 1-5% of tenants first (canary group)
        ↓
        Monitor canary for errors and performance issues
        Canary passes?
        YES → Roll out to remaining tenants in batches
        NO → Halt rollout, investigate, fix, retry
    NO → Dispatch all tenant migration jobs
        ↓
        Use separate queue for tenant migrations
        Limit concurrency to avoid connection pool exhaustion
        Wrap each tenant migration in its own transaction

---

## Rationale

Sequential fan-out doesn't scale beyond ~50 tenants. Queued fan-out provides parallel processing, automatic retry, and failure isolation. Canary rollout catches issues before they affect all tenants. Each tenant must be migrated in its own transaction so a failure doesn't roll back successful migrations.

---

## Recommended Default

**Default:** Queued fan-out with canary rollout for 50+ tenants
**Reason:** Parallel processing reduces total migration time. Canary catches issues early. Queue provides retry and isolation.

---

## Risks Of Wrong Choice

* Sequential for 1000+ tenants: ~17 hours or more, deployment window exceeded
* All tenants in one transaction: one failure rolls back all tenants
* No canary: a migration that works on small tenant DB fails on large tenant
* Connection pool exhaustion: too many concurrent tenant connections

---

## Related Rules

* Wrap each tenant migration in its own transaction
* Test migrations on a large tenant database before rolling to all

---

## Related Skills

* Orchestrate migrations across multi-tenant databases
