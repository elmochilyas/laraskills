# Metadata

Domain: Security & Identity Engineering
Subdomain: Audit Logging
Knowledge Unit: Multi-tenant audit logging
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Multi-tenant audit logging ensures that log entries are isolated per tenant, scoped to the correct actor (tenant-specific user), and auditable without leaking cross-tenant data. Packages like `ahmed3bead/laravel-tenant-audit` extend activity logging with `tenant_id` scoping, polymorphic tenant actor resolution, and per-tenant retention policies. The core challenges: ensuring every log entry carries the correct tenant context (even in queue jobs), preventing cross-tenant log leakage in queries, and managing per-tenant retention policies. A missing tenant context is a cross-tenant data leak in the audit log.

---

# Core Concepts

- **Tenant-Scoped Log**: Every audit entry is tagged with `tenant_id`. Queries are automatically scoped to the current tenant via global scope or explicit condition.
- **Polymorphic Tenant Actor**: The actor (causer) may be a user within a tenant context. The `causer_type`/`causer_id` plus `tenant_id` uniquely identifies who did what.
- **Per-Tenant Retention**: Different tenants may have different retention requirements (enterprise: 7 years, free: 30 days). Retention jobs must filter by `tenant_id`.
- **Queue Context Propagation**: In queue jobs, the tenant context must be restored from serialized job data before logging. Missing tenant context = log entry without tenant = cross-tenant leak risk.

---

# Mental Models

- **Log as Data, Not Metadata**: In multi-tenant apps, the audit log is tenant data just like any other model. It must be isolated, queryable, and retainable per tenant.
- **Tenant as Log Category**: Think of `tenant_id` as the category label on every log entry. You query logs within one category; you never see logs from other categories.

---

# Patterns

## Global Scope Auto-Scoping Pattern
- **Implementation**: Add a global scope to the activity log model that automatically filters by `tenant_id`. Set `tenant_id` from `tenancy()->tenantId()` on model creation.
- **Benefits**: Developers cannot accidentally query all tenants' logs.
- **Tradeoffs**: Need to bypass scope in admin tools (tenant switching UI must use `withoutGlobalScopes`).

## Queue Context Restoration Pattern
- **Implementation**: `ShouldQueue` job includes `$tenantId` property. `handle()` method calls `tenancy()->initialize($this->tenantId)` before processing. All log entries during processing carry the correct tenant context.
- **Benefits**: Queue jobs produce tenant-scoped logs without manual tenant ID passing to each log call.
- **Tradeoffs**: Tenancy initialization must be robust — if it fails, the job should fail (not log to wrong tenant).

## Tenant Retention Schedule Pattern
- **Implementation**: Scheduled artisan command: `foreach tenant: delete activity_log where tenant_id = {tenant} AND created_at < now() - {tenant->retention_days}`.
- **Benefits**: Per-tenant retention without manual processing.
- **Tradeoffs**: Iterating over all tenants individually is slow. Batch by retention policy group.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `tenant_id` column on log table | All log rows tagged | Add `tenant_id` to the activity log migration. Index it. Query it. Never show logs without tenant_id |
| Global scope vs explicit where | Automatic vs intentional scoping | Global scope for safety (prevent leaks). Explicit where for performance (global scopes sometimes degrade query planning) |
| Per-tenant log table vs shared | Complete isolation vs operational simplicity | Shared table with tenant_id for 99% of apps. Per-tenant table only when regulatory requirements demand full separation |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Global scope prevents accidental cross-tenant log exposure | Bypassing scope requires explicit code | Admin logs feature must use `withoutGlobalScopes()` — if forgotten, admin sees no data |
| Queue context restoration ensures correct tenant tagging | Every job must include and restore tenant_id | Forgetting to initialize tenant in a job logs to wrong tenant (or null tenant — a leak) |
| Per-tenant retention meets compliance | Multiple tenants = multiple retention queries | Schedule must handle 1000+ tenants efficiently |

---

# Performance Considerations

- `tenant_id` index on the activity log table is essential. All queries filter by tenant.
- Global scope adds a `WHERE tenant_id = ?` to every query. No significant overhead with proper indexing.
- Per-tenant retention: batch tenants by retention_days, not individually. `DELETE FROM activity_log WHERE tenant_id IN (SELECT id FROM tenants WHERE retention_days = 90) AND created_at < ...`.

---

# Production Considerations

- **Missing Tenant ID**: Any log entry with `tenant_id = NULL` is a potential cross-tenant leak indicator. Monitor for null tenant_ids and alert.
- **Admin Tenant Switching**: When an admin views tenant T's logs, the global scope must use tenant T's ID, not the admin's tenant ID. The admin tool sets the "impersonated tenant" context.
- **Log Export**: Tenant log export must filter by `tenant_id`. Export the tenant's logs only. Include a verification step that the export contains no other tenant's data.

---

# Common Mistakes

- **Not including tenant_id in log queries**: `ActivityLog::all()` without tenant scope returns ALL tenants' logs — a data leak. Always scope.
- **Forgetting tenant context in queue jobs**: A job dispatches log entries without restoring tenant context. Entries are tagged with null tenant or the previous request's tenant — cross-tenant contamination.
- **Using the same retention policy for all tenants**: Enterprise tenants with 7-year retention have their logs pruned after 30 days (accidental data loss). Store retention per tenant.
- **Not indexing tenant_id on the activity log**: Every admin page and tenant view queries activity by tenant. Full table scan on a 10M-row log table = disaster.

---

# Failure Modes

- **Queue Job Without Tenant Context**: A job creates an audit log entry but `tenant_id` is not set. The entry belongs to no tenant — invisible to all tenant views. Mitigation: reject log entries with null tenant_id.
- **Cross-Tenant Log Query in Admin**: Admin user with access to all tenants runs an un-scoped query. 10M rows of all tenants returned. Memory exhaustion. Mitigation: force pagination with tenant filter in admin tools.
- **Retention Deletes Wrong Data**: A bug in the retention job deletes logs from tenant A instead of tenant B. Irreversible data loss. Mitigation: use `WHERE tenant_id = ?` with explicit tenant ID, never a batch query without tenant filter.

---

# Related Knowledge Units

- Prerequisites: Multi-tenancy security (global scopes, database isolation), Spatie laravel-activitylog
- Related: Comprehensive audit logging (HMAC, diffs, alerts), Tenant-aware queues and job context
- Advanced Follow-up: Cross-tenant audit log verification, Append-only per-tenant log tables, Multi-tenant SIEM integration

## Ecosystem Usage
- **Spatie Laravel Activitylog**: The most widely installed audit logging package (48M+ installs); provides trait-based automatic model event logging, named logs for logical partitioning, and attribute change tracking.
- **Multi-tenant audit**: Audit logs synchronized across tenant contexts; separate audit database connections or named logs ensure tenant isolation while maintaining centralized audit querying.
- **Immutable audit chains**: Cryptographic hash chains link consecutive audit entries with hash pointers; tampering with historical entries breaks the chain, enabling detection of unauthorized audit modification.
- **Comprehensive audit logging**: Captures before/after state, request context (IP, user agent), causer identification, and timestamp. Dedicated audit storage separate from application data prevents data loss during application rollbacks.
- **Audit event filtering**: Configurable audit event types (created, updated, deleted, restored, forceDeleted); custom events via manual activity recording. Named log separation for billing, security, and content audit trails.
- **Audit data retention**: model:prune integration for automated audit data lifecycle management; configurable retention periods per audit namespace.
- **Audit integrations**: Filament admin panels display audit trails with formatted diffs; Nova resources integrate via custom fields; custom admin UIs use the Activity model directly.
- **Audit middleware alignment**: Audit packages integrate with Laravel's middleware pipeline, request lifecycle, and model events; causer resolution uses the auth guard chain.

## Research Notes
- Spatie Laravel Activitylog v5 (March 2026) introduced a dedicated ttribute_changes column separating model changes from user-provided properties — this enables cleaner queries and avoids JSON pollution in the properties column.
- Immutable audit chains compute a cumulative hash over consecutive audit entries — each entry includes a hash pointer to the previous entry, and tampering with any entry breaks the chain. This is additive security and does not prevent tampering but makes it detectable.
- Multi-tenant audit logging in shared-database setups requires tenant-aware causer resolution and per-tenant query scoping — without this, audit queries from one tenant can expose another tenant's activity data.
- Audit log retention requirements vary by regulation: GDPR requires erasure of personal data on request but may retain audit metadata; PCI DSS requires 12-month retention with 3-month immediate accessibility; SOC2 recommends 6-12 months.
- The Activitylog v5 buffer system collects activity objects in memory during a request and flushes them as a single bulk INSERT after the response — this improves throughput for write-heavy applications but means activities have no DB ID until flush completes.
- Community packages for comprehensive audit logging (dineshstack-audit, laravel-audit-chain) provide features beyond basic activity logging — field-level diffs, batch grouping, custom alert rules, and cryptographic audit chain verification.
- Audit log overload is a common failure mode — logging every Eloquent event including etrieved reads can produce millions of unnecessary audit entries; careful event type filtering is essential for production audit log management.
- The Activitylog package's eforeLogging hook enables cross-cutting enrichment (request ID, tenant context, IP address) without subclassing the logger — this is the recommended pattern for multi-tenant and distributed audit environments.

## Internal Mechanics
- **Spatie Activitylog v5 Resolution Flow**: Model event fires (updated, created, deleted) → LogsActivity trait's event listeners fire → the trait's handler builds an ActivityLog instance with causer, subject, event type, and attribute changes → the activity is passed to the configured LogActivityAction class → the action's save() method writes the activity to the ctivity_log table (or appends to the in-memory buffer if buffering is enabled).
- **Activity Buffer Flushing**: The ActivityBuffer singleton collects ActivityLog instances during the request lifecycle → lush() is called in the 	erminating middleware and as a PHP shutdown function (egister_shutdown_function) → buffered activities are bulk-INSERTed in a single query → buffer is cleared after flush.
- **Named Logs Implementation**: ctivity()->inLog('billing') sets the log_name column on the ActivityLog instance → querying named logs uses ActivityLog::query()->where('log_name', 'billing') — this is a simple column filter, not a separate table or partition.
- **Comprehensive Audit Diffs**: Attribute changes are computed by comparing $model->getOriginal() (database state before the change) with $model->getAttributes() (current state after the change) → only changed attributes are stored in the activity log → the diff format varies by package (Spatie v5 stores in ttribute_changes JSON column as {attributes: {...}, old: {...}}).
- **Causer Resolution**: The default causer is resolved from Auth::user() via CauserResolver → if no authenticated user (e.g., CLI command, queue worker without auth), the causer is null → Activity::defaultCauser() can override the causer for a specific code block in v5.
- **Immutable Audit Chain**: Each audit entry includes a hash_pointer column containing the hash of the previous entry → the hash is computed as hash('sha256',  .  . ) → verifying the chain re-computes each hash from the first entry to the last and confirms the chain is unbroken.
