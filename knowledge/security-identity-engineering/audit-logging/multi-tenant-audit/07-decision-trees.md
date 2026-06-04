# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Audit Logging
**Knowledge Unit:** Multi-tenant Audit Logging
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Tenant Isolation Model | Shared table vs per-tenant table | architectural, isolation |
| 2 | Tenant Context Propagation | How tenant context follows into queue jobs | architectural, security |

---

# Architecture-Level Decision Trees

---

## Tenant Isolation Model

---

## Decision Context

Whether to store audit logs in a shared table with `tenant_id` scoping or in per-tenant tables/databases.

---

## Decision Criteria

* architectural
* isolation

---

## Decision Tree

What is the multi-tenancy architecture?
↓
Shared database with tenant_id → Shared audit log table with `tenant_id` column
Database-per-tenant → Audit logs are naturally isolated (separate DB per tenant)

What is the regulatory requirement?
↓
Full data isolation (each tenant's data must be physically separate) → Per-tenant tables or databases
Logical isolation sufficient → Shared table with `tenant_id`

What is the number of tenants?
↓
Many (1000+) → Shared table (practical: per-tenant tables are unmanageable at scale)
Few (10-100) → Per-tenant tables feasible

How large is each tenant's audit log?
↓
Small-med (< 1M entries) → Shared table with index on `tenant_id`
Large (10M+ entries) → Consider per-tenant tables for query performance

Does the application need cross-tenant audit views (platform admin)?
↓
YES → Shared table simplifies cross-tenant queries
NO → Per-tenant tables enforce isolation

---

## Rationale

Shared table with `tenant_id` is the default for most multi-tenant applications. It simplifies cross-tenant queries (platform admin view), scales better than per-tenant tables, and with proper indexing (`tenant_id`, `created_at`) performs well for tenant-scoped queries. Per-tenant tables or databases are only justified when regulatory requirements mandate physical data separation.

---

## Recommended Default

**Default:** Shared audit log table with `tenant_id` column and composite index on `(tenant_id, created_at)`; per-tenant databases only when regulatory requirements mandate physical separation
**Reason:** Shared table is the most practical and scalable approach for multi-tenant audit logging. It supports cross-tenant admin views, simplifies retention management, and performs well with proper indexing. Per-tenant isolation adds significant operational complexity (schema management, migrations per tenant) that is only justified by regulatory requirements.

---

## Risks Of Wrong Choice

- Shared table without tenant_id: cross-tenant data leak
- Shared table without tenant_id index: slow queries on large tables
- Per-tenant tables without cross-tenant query capability: platform admin cannot view all logs
- Per-tenant tables for 1000+ tenants: schema migration nightmare

---

## Related Rules

- Scope Audit Logs by Tenant ID (05-rules.md)
- Set tenant_id Automatically via Middleware or Model Events (05-rules.md)
- Index the Audit Log Table by `(tenant_id, created_at)` (05-rules.md)

---

## Related Skills

- Implement Multi-Tenant Audit Logging with Tenant Isolation (06-skills.md)

---

## Tenant Context Propagation

---

## Decision Context

How to ensure queued audit operations log with the correct tenant context.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Does the queue job perform audit logging?
↓
YES → Must include and restore tenant context
NO → No tenant context issue

Is the queue job dispatched from a tenant-scoped request?
↓
YES → Serialize `tenant_id` in job constructor
NO → Is this a system-wide job with no tenant?
    YES → No tenant context needed (platform-level operation)
    NO → Log as platform event (not tenant-scoped)

Does the queue framework support tenant context restoration?
↓
YES (stancl/tenancy queue middleware) → Use built-in context restoration
NO → Explicitly call `tenancy()->initialize($this->tenantId)` in `handle()`

Is there a fallback for jobs with null/missing tenant_id?
↓
YES → Log warning, skip tenant-scoped logging, or default to platform scope
NO → Implement fallback (null tenant_id is a potential data leak)

---

## Rationale

Queue jobs run outside the HTTP request context where tenant context is automatically available. Without explicit restoration, queued audit operations may log under the wrong tenant or with a null tenant_id — both are security issues. The cleanest approach is to serialize the tenant_id in the job constructor and restore it at the start of `handle()`. Queue middleware (stancl/tenancy) can automate this.

---

## Recommended Default

**Default:** Serialize `$tenantId` in the job constructor; call `tenancy()->initialize($this->tenantId)` at the start of `handle()`; use queue middleware for automated restoration when available
**Reason:** Explicit tenant context restoration prevents the most common multi-tenant audit bug — logs with wrong or missing tenant_id. Queue middleware automates this, but direct initialization in `handle()` is more explicit and works without framework dependencies.

---

## Risks Of Wrong Choice

- Not restoring tenant context: log entries tagged with null or wrong tenant
- Relying on global state: global tenant state may not be set in queue context
- Missing tenant_id in job constructor: cannot restore tenant at all
- No fallback for null tenant: log entries visible to no tenant or all tenants

---

## Related Rules

- Log Tenant-Specific Events Separately From Cross-Tenant Events (05-rules.md)
- Implement Tenant-Level Audit Log Retention Policies (05-rules.md)

---

## Related Skills

- Implement Multi-Tenant Audit Logging with Tenant Isolation (06-skills.md)
