# Anti-Patterns: Multi-tenant Audit Logging

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Multi-tenant Audit Logging |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-MTA-01 | No Global Scope — Relying on Developer Discipline | Critical | High | Medium |
| AP-MTA-02 | Missing Tenant Context in Queue Jobs | Critical | High | Low |
| AP-MTA-03 | Logging Outside Tenant Context | High | Medium | Medium |
| AP-MTA-04 | Same Retention Policy for All Tenants | Medium | High | Low |
| AP-MTA-05 | Not Indexing tenant_id on Activity Log | Medium | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Admin tools using unscoped queries**: Admin tools querying all tenants' logs without explicit tenant filter — data leak
- **No monitoring for null tenant_id**: Missing tenant context goes undetected, hiding potential cross-tenant leaks
- **Cross-tenant retention cleanup bugs**: Retention deletion jobs deleting wrong tenant's logs due to missing tenant_id filter

---

## 1. No Global Scope — Relying on Developer Discipline

### Category
Security · Architecture

### Description
Relying on manual `->where('tenant_id', ...)` calls instead of a global Eloquent scope to filter audit log queries, inevitably leading to missed filters that return cross-tenant data.

### Why It Happens
Manual `where` calls feel natural and explicit. Developers trust themselves and their team to remember the filter every time. The global scope approach feels "magical" and less transparent. The activity log query is written once and reused, so the filter seems like a one-time concern.

### Warning Signs
- Activity log queries use `->where('tenant_id', $tenantId)` manually
- No global scope is registered on the ActivityLog model
- Some query paths exist (admin tools, reports, API endpoints) that query activity logs without filtering
- The activity_log table returns all tenants' data on `ActivityLog::all()`

### Why Harmful
A single missed `where('tenant_id')` — in a new controller, a report query, or an admin tool — returns every tenant's audit data to the wrong tenant. Audit logs contain sensitive information (who did what, when, from which IP). Cross-tenant audit log leakage is a data breach.

### Real-World Consequences
- Admin dashboard shows Tenant A's audit entries to Tenant B
- API endpoint returns unfiltered audit data — data breach reported to regulator
- New developer writes a query without tenant filter in first week — data leak
- Security audit identifies missing tenant scoping as critical vulnerability

### Preferred Alternative
Add a global scope to the ActivityLog model that automatically adds `WHERE tenant_id = ?` to every query. Override with `withoutGlobalScope()` only in audited, deliberate scenarios.

### Refactoring Strategy
1. Add a global scope to the ActivityLog model that filters by `tenant_id`
2. Set `tenant_id` automatically on creation in the model's `creating` event
3. Remove all manual `->where('tenant_id', ...)` calls from queries
4. Audit existing codebase for queries missing tenant_id filter
5. Add tests that verify tenant scoping is applied to all query paths
6. For admin tools requiring cross-tenant access, use explicit `withoutGlobalScopes()` with audit logging

### Detection Checklist
- [ ] Is there a global scope on the ActivityLog model?
- [ ] Are queries using `->where('tenant_id', ...)` manually?
- [ ] Does `ActivityLog::all()` return filtered or unfiltered data?
- [ ] Does the model auto-set `tenant_id` on creation?
- [ ] Are there query paths without tenant filtering?

### Related Rules/Skills/Trees
- Apply Global Scope for Tenant Isolation on Activity Log (05-rules.md)
- Configure Multi-Tenant Audit Logging (06-skills.md)
- Shared Database + Global Scopes (06-skills.md)

---

## 2. Missing Tenant Context in Queue Jobs

### Category
Security · Operations

### Description
Queue jobs performing audit logging without restoring the tenant context, resulting in log entries tagged with `tenant_id = NULL` or the wrong tenant, creating audit gaps or cross-tenant data leaks.

### Why It Happens
Queue jobs operate outside the HTTP request lifecycle where tenant context is typically set. Developers serialize the job data but forget to include `tenant_id` in the payload. The queue worker has no tenant context by default and processes the job in whatever state the previous job left.

### Warning Signs
- Activity log entries from queue jobs have `tenant_id = NULL`
- Queue job classes do not have a `$tenantId` property
- No `tenancy()->initialize()` call in the job's `handle()` method
- Audit trail shows un-attributable actions from queue processing

### Why Harmful
A log entry without `tenant_id` is invisible to all tenant queries (due to global scoping) — the action is lost from the audit trail. If the queue worker happens to retain a previous job's tenant context, the entry is attributed to wrong tenant, creating a cross-tenant contamination.

### Real-World Consequences
- Audit entry has null tenant — action cannot be attributed to any tenant
- Queue job processes in wrong tenant context — writes appear under wrong tenant
- Compliance investigation finds audit trail gaps from queue operations
- Customer support cannot determine who triggered a queued action

### Preferred Alternative
Every queue job that performs audit logging must include `$tenantId` in its serialized payload and call `tenancy()->initialize($this->tenantId)` as the first step in `handle()`.

### Refactoring Strategy
1. Add `public ?string $tenantId` property to every job class performing audit logging
2. Include `tenant_id` in the job dispatch: `processJob::dispatch($data, tenancy()->tenantId())`
3. In `handle()`, restore context: `tenancy()->initialize($this->tenantId)`
4. For jobs that fail without tenant context, throw an exception
5. Add tests that verify job executes in correct tenant context
6. Monitor for null `tenant_id` entries in the audit log

### Detection Checklist
- [ ] Do queue job classes have a `$tenantId` property?
- [ ] Is `tenancy()->initialize()` called in `handle()`?
- [ ] Are there audit entries with `tenant_id = NULL` from queue operations?
- [ ] Is tenant context passed at job dispatch time?
- [ ] Do jobs fail if tenant context cannot be restored?

### Related Rules/Skills/Trees
- Restore Tenant Context in Queue Job Audit Logging (05-rules.md)
- Configure Multi-Tenant Audit Logging (06-skills.md)
- Tenant-Aware Queues and Job Context (06-skills.md)

---

## 3. Logging Outside Tenant Context

### Category
Security · Architecture

### Description
Executing audit logging in CLI commands, webhooks, or scheduled tasks without establishing tenant context, producing log entries that lack tenant association and cannot be attributed.

### Why It Happens
CLI commands and scheduled tasks run in an Artisan context with no HTTP request and no middleware tenant resolution. Developers add audit logging to these commands without considering tenant context — the code works, logs are created, but they lack `tenant_id`.

### Warning Signs
- Scheduled tasks (`$schedule->command()`) produce activity log entries
- CLI commands (`php artisan some:command`) log activity
- Webhook handlers process data for a tenant but don't initialize tenant context
- Log entries from these sources have `tenant_id = NULL`

### Why Harmful
Log entries outside tenant context are orphaned — they exist in the database but are not scoped to any tenant. They are invisible to all tenant-scoped queries (creating audit gaps) and are not cleaned up by per-tenant retention policies (creating storage waste). During a security investigation, these entries represent un-attributable actions.

### Real-World Consequences
- CLI cleanup script modifies data but logs have no tenant — action untracked
- Webhook processes tenant data, log goes to the wrong tenant (or null)
- Scheduled report generation entries cannot be attributed to a tenant
- Storage fills with orphaned log entries not covered by any retention policy

### Preferred Alternative
In CLI commands and webhooks, initialize tenant context before logging. For single-tenant commands, iterate over all tenants and log per-tenant. For system-level operations, use a dedicated system tenant marker.

### Refactoring Strategy
1. Identify all CLI commands, scheduled tasks, and webhooks that log activity
2. For per-tenant operations, wrap in `tenancy()->initialize($tenantId)` loop
3. For system operations, log to a dedicated `log_name` with explicit null tenant
4. Add tenant context initialization as the first step in webhook handler
5. Add monitoring for null `tenant_id` entries from CLI/webhook sources
6. Document which operations are tenant-scoped vs system-scoped

### Detection Checklist
- [ ] Do CLI commands initialize tenant context before logging?
- [ ] Do scheduled tasks have tenant context when logging?
- [ ] Do webhook handlers establish tenant context?
- [ ] Are there log entries with `tenant_id = NULL` from Artisan commands?
- [ ] Is there a process to review null-tenant audit entries?

### Related Rules/Skills/Trees
- Initialize Tenant Context in CLI and Webhook Audit Logging (05-rules.md)
- Configure Multi-Tenant Audit Logging (06-skills.md)
- Tenant-Aware Queue and CLI Context (06-skills.md)

---

## 4. Same Retention Policy for All Tenants

### Category
Operations · Compliance

### Description
Applying a single retention policy (e.g., delete after 90 days) to all tenants' audit logs regardless of their subscription tier or compliance requirements, either losing data for enterprise tenants or wasting storage on free-tier tenants.

### Why It Happens
Implementing per-tenant retention requires storing `retention_days` per tenant, modifying the pruning job to filter by tenant, and testing variable retention. A single retention value is the easiest default, and the business requirement for differentiated retention is discovered later.

### Warning Signs
- `retention_days` is a hardcoded constant in the pruning job
- The activity_log table has a global index on `created_at` but no tenant-specific retention
- Enterprise tenants have regulatory requirements for 7-year retention
- Free-tier tenants have low-value logs kept for the same duration as enterprise

### Why Harmful
Free-tier tenants' logs consume as much storage as enterprise — a cost that cannot be recovered from free users. Enterprise tenants needing 7-year retention may have logs pruned prematurely if the policy is set too short. Regulatory fines from premature deletion of enterprise audit data exceed the storage savings.

### Real-World Consequences
- Enterprise tenant's 7-year retention requirement cannot be met — compliance finding
- Storage costs for free-tier tenants at enterprise-retention levels — unnecessary expense
- Single retention policy cannot satisfy diverse tenant requirements
- Emergency data restoration from backups to recover prematurely-pruned enterprise logs

### Preferred Alternative
Store `retention_days` per tenant (in the Tenant model or subscription settings). The pruning job filters by each tenant's retention period and batch-processes by `retention_days` group.

### Refactoring Strategy
1. Add `retention_days` column to the Tenant model with a default value
2. Update the pruning job to group tenants by `retention_days`
3. For each group, delete entries older than the tenant's retention: `WHERE tenant_id IN (group) AND created_at < now() - group.retention_days`
4. Add a UI or API for tenant admins to configure their retention period
5. Set default retention per subscription tier in the tenant creation flow
6. Add verification: alert if a tenant's log count exceeds retention-based expected maximum

### Detection Checklist
- [ ] Is `retention_days` stored per tenant?
- [ ] Does the pruning job filter by tenant-specific retention?
- [ ] Is there a default retention policy tied to subscription tier?
- [ ] Can enterprise tenants configure longer retention?
- [ ] Is retention-based storage cost allocated to each tenant?

### Related Rules/Skills/Trees
- Implement Per-Tenant Audit Log Retention Policy (05-rules.md)
- Configure Multi-Tenant Audit Logging (06-skills.md)
- Multi-Tenant Data Retention Strategy (06-skills.md)

---

## 5. Not Indexing tenant_id on Activity Log

### Category
Performance · Operations

### Description
Deploying the `activity_log` table without an index on `tenant_id`, causing every tenant-scoped query to perform a full table scan on a rapidly growing table.

### Why It Happens
Developers focus on indexing the primary key and `created_at` for general queries. The `tenant_id` column seems like just another foreign key. Since activity logs are append-only and not typically queried for real-time operations, the performance impact of missing index is not immediately visible.

### Warning Signs
- `activity_log` table has no index on `tenant_id`
- Queries filtering by tenant take >1 second on tables >100K rows
- `EXPLAIN` shows full table scan for tenant-filtered activity log queries
- Multi-tenant admin reports on activity data are slow

### Why Harmful
Without a `tenant_id` index, every query must scan all rows to find entries for the current tenant. As the table grows, query time increases linearly. A 10M-row activity log without tenant_id index takes seconds to return a single tenant's entries. This impacts admin pages, audit reports, and any feature displaying activity history.

### Real-World Consequences
- Admin activity dashboard takes 10+ seconds to load
- Audit report generation times out
- API endpoint for user activity history is unusably slow
- Developers add caching as workaround, serving stale data
- Emergency index addition requires table lock or downtime

### Preferred Alternative
Add a composite index on `(tenant_id, created_at)` for efficient tenant-scoped queries that are also ordered by time.

### Refactoring Strategy
1. Create a migration: `$table->index(['tenant_id', 'created_at'])`
2. For MySQL 8.0+, use `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` for online DDL
3. For PostgreSQL, create the index concurrently: `CREATE INDEX CONCURRENTLY`
4. Verify query performance after index creation
5. Add composite indexes with `log_name` or `event` if those are common filter combinations
6. Add monitoring: track full table scans on activity_log table

### Detection Checklist
- [ ] Is there an index on `tenant_id` in the activity_log table?
- [ ] Is there a composite index on `(tenant_id, created_at)`?
- [ ] What does `EXPLAIN` show for tenant-filtered queries?
- [ ] Are admin activity views performing well?
- [ ] Is the activity_log table scan count tracked in database monitoring?

### Related Rules/Skills/Trees
- Index tenant_id on Activity Log Table (05-rules.md)
- Configure Multi-Tenant Audit Logging (06-skills.md)
- Database Indexing for Multi-Tenant Audit (06-skills.md)
