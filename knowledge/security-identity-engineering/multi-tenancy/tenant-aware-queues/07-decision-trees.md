# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** Tenant-Aware Queues and Job Context
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Automatic vs Manual Tenant Context Propagation | How tenant context reaches queue jobs | security, maintainability |
| 2 | Per-Tenant Queue Workers vs Shared Worker | Queue worker architecture | isolation, scalability |

---

# Architecture-Level Decision Trees

---

## Automatic vs Manual Tenant Context Propagation

---

## Decision Context

Whether to rely on stancl/tenancy's automatic queue context propagation or manually add `$tenantId` to every job class.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the project already using stancl/tenancy?
↓
YES → Use automatic propagation (package handles serialization and restoration)
NO → Manual propagation required (custom multi-tenancy or no package)

Is there a risk that developers forget tenant_id on new job classes?
↓
YES → Automatic (stancl/tenancy) or enforce via custom job base class
NO → Manual propagation acceptable (still fragile)

Are jobs dispatched from admin/global context (no tenant)?
↓
YES → Manual propagation offers explicit control (tenants can be nullable)
NO → Automatic propagation handles all tenant-scoped jobs

How many job classes exist?
↓
Few (< 10) → Manual propagation feasible (easy to audit)
Many (10+) → Automatic propagation strongly preferred (forgetting one job leaks data)

---

## Rationale

Automatic propagation (stancl/tenancy) is strictly safer because it eliminates the human factor — developers cannot forget to include tenant context on a job. Manual propagation requires every job class to have a `$tenantId` property and restore context in `handle()`. The risk of forgetting one job is proportional to the number of job classes. For projects using stancl/tenancy, automatic propagation is trivial to enable. For custom multi-tenancy, a custom base job class or middleware pattern should be used.

---

## Recommended Default

**Default:** Automatic propagation via stancl/tenancy (if using the package); manual propagation with a custom base job class otherwise; always fail jobs that cannot restore tenant context
**Reason:** Automatic propagation eliminates the most common source of cross-tenant data leaks in multi-tenant applications — jobs dispatched without tenant context. Manual propagation is fragile and requires discipline.

---

## Risks Of Wrong Choice

- No tenant context on job: job runs un-scoped queries, returning all tenants' data
- Static tenant context: queue worker processes multiple jobs, static state leaks between jobs
- Silent context restoration failure: job processes data in wrong tenant without error
- Admin job with accidental tenant context: global operation scoped to one tenant

---

## Related Rules

- Tag or Prefix Queue Jobs With tenant_id (05-rules.md)
- Set Tenant Context Before Job Execution (05-rules.md)
- Use Separate Queue Workers per Tenant for Isolation (05-rules.md)

---

## Related Skills

- Implement Tenant-Aware Queue Jobs for Cross-Tenant Data Safety (06-skills.md)

---

## Per-Tenant Queue Workers vs Shared Worker

---

## Decision Context

Whether to run dedicated queue workers per tenant or a single shared worker for all tenants.

---

## Decision Criteria

* isolation
* scalability

---

## Decision Tree

How many tenants does the application serve?
↓
Few (< 10) → Per-tenant workers feasible (manageable number of processes)
Many (10+) → Shared worker (per-tenant workers consume too many system resources)

Does one tenant's slow job need to block other tenants?
↓
YES → Mitigated by per-tenant workers (blocking is isolated to that tenant's queue)
NO → Shared worker acceptable (single worker handles all tenants fairly)

What is the queue volume per tenant?
↓
High → Per-tenant workers ensure fair resource allocation
Low → Shared worker is sufficient (queue is mostly idle)

Is the operational complexity budget limited?
↓
Limited → Shared worker (one queue to monitor, one worker to manage)
Generous → Per-tenant workers (N queues, N worker configs, N monitors)

Are per-tenant queue prefixes configured?
↓
YES → Per-tenant workers can listen on `tenant-{id}` queues
NO → Shared worker on a single queue with tenant scoping

---

## Rationale

Per-tenant queue workers provide true isolation — one tenant's heavy or failing jobs cannot block other tenants. However, they add N× the process count and operational complexity. For most applications with <50 tenants, per-tenant workers are recommended. For SaaS applications with 1000+ tenants, per-tenant workers are impractical and a shared worker with fair queue processing is required.

---

## Recommended Default

**Default:** Per-tenant workers for <50 tenants (isolated queue per tenant); shared worker for 100+ tenants with tenant-prefixed queues for monitoring; queue tags (stancl/tenancy) for fair processing regardless of scale
**Reason:** Per-tenant workers prevent the noisy-neighbor problem where one tenant's jobs starve others. At high tenant counts, the process overhead becomes prohibitive and a shared worker with smart queue configuration is the only scalable option.

---

## Risks Of Wrong Choice

- Shared worker with slow tenant job: all tenants' jobs delayed
- Per-tenant worker for 1000 tenants: 1000+ worker processes, massive resource consumption
- No queue prefix: worker cannot distinguish which tenant's jobs to process
- Missing worker restart on deploy: tenant workers run stale code

---

## Related Rules

- Use Separate Queue Workers per Tenant for Isolation (05-rules.md)
- Tag or Prefix Queue Jobs With tenant_id (05-rules.md)

---

## Related Skills

- Implement Tenant-Aware Queue Jobs for Cross-Tenant Data Safety (06-skills.md)
