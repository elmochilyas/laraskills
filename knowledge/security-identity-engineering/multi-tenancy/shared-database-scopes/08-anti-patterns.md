# Anti-Patterns: Shared Database + Global Eloquent Scopes

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | Shared Database + Global Eloquent Scopes |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SDS-01 | Manual `where('tenant_id')` Without Global Scope | Critical | High | Medium |
| AP-SDS-02 | Storing Tenant ID in Session Only | Critical | High | Medium |
| AP-SDS-03 | No Composite Unique Indexes | High | High | Low |
| AP-SDS-04 | Auto-Increment IDs Instead of UUIDs | Medium | High | High |
| AP-SDS-05 | Unaudited `withoutGlobalScopes()` Usage | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Queue jobs without tenant context**: Forgetting to restore tenant context in queue workers is the most common cross-tenant leak
- **Not using BelongsToTenant trait**: Relying on individual model configuration instead of a reusable trait
- **Missing tenant_id foreign keys**: Tenant-scoped tables without FK constraints to the tenants table

---

## 1. Manual `where('tenant_id')` Without Global Scope

### Category
Security · Architecture

### Description
Relying on individual developers to manually add `->where('tenant_id', ...)` to every query instead of using an Eloquent global scope, inevitably resulting in missed filters that leak cross-tenant data.

### Why It Happens
Manual `where` calls feel explicit and transparent. Global scopes feel "magical" and invisible — developers worry about unexpected behavior. The pattern starts with one query, one developer, and works fine. As the team grows and queries multiply, the filter is inevitably forgotten in some code paths.

### Warning Signs
- No global scope trait exists for tenant scoping
- Queries contain `->where('tenant_id', $tenantId)` manually
- Some query paths (API endpoints, admin tools, reports) lack the tenant filter
- Raw SQL or `DB::table()` queries don't include tenant filtering
- `Model::all()` returns all tenants' data

### Why Harmful
A single missed `where('tenant_id')` — in a new report, a forgotten query path, a raw SQL statement — returns all tenants' data to the wrong tenant. This is a data breach. Because there is no automated enforcement, the vulnerability persists until discovered, potentially exposing all tenant data to every tenant.

### Real-World Consequences
- API endpoint returns unfiltered data — cross-tenant data breach
- New developer writes query without tenant filter in first week — critical data leak
- Security audit identifies 47 query paths without tenant filtering
- GDPR notification required because tenant data was exposed cross-tenant

### Preferred Alternative
Create a `BelongsToTenant` trait with a global scope that automatically applies `WHERE tenant_id = ?` to every query. Use `withoutGlobalScopes()` only in explicitly audited scenarios.

### Refactoring Strategy
1. Create a `BelongsToTenant` trait with `addGlobalScope('tenant', ...)` and `creating` event to set `tenant_id`
2. Apply the trait to every tenant-scoped model
3. Search for and remove all manual `->where('tenant_id', ...)` calls
4. Audit `DB::table()`, raw SQL, and `Model::all()` calls for missing tenant scoping
5. Add automated tests that verify tenant scoping for every model
6. Implement a CI check that rejects queries without tenant scoping

### Detection Checklist
- [ ] Is there a reusable `BelongsToTenant` trait?
- [ ] Are there manual `->where('tenant_id')` calls in the codebase?
- [ ] Does `Model::all()` return filtered or unfiltered data?
- [ ] Are raw SQL queries tenant-scoped?
- [ ] Are there tests verifying tenant scoping on every model?

### Related Rules/Skills/Trees
- Use Global Eloquent Scopes for Tenant Isolation (05-rules.md)
- Configure Shared Database + Global Scopes (06-skills.md)
- BelongsToTenant Trait Implementation (06-skills.md)

---

## 2. Storing Tenant ID in Session Only

### Category
Security · Architecture

### Description
Storing the current tenant context only in the user's session without propagating it to queue jobs, CLI commands, webhooks, and other non-HTTP execution contexts, causing these operations to lose tenant context.

### Why It Happens
The session is the natural place for request-scoped data in Laravel. Middleware resolves the tenant from the incoming request and stores it in the session. This works perfectly for HTTP requests. Developers forget that queue jobs, scheduled tasks, and webhooks execute outside the HTTP request lifecycle and don't have access to the session.

### Warning Signs
- Tenant context is read from `session()->get('tenant_id')`
- Queue job classes don't have a `$tenantId` property
- CLI commands and scheduled tasks don't initialize tenant context
- Webhook handlers don't restore tenant context before processing
- Cross-tenant data leaks originate from queue or CLI operations

### Why Harmful
Queue jobs, CLI commands, and webhooks operating without tenant context run with either no tenant scope (returning all tenants' data) or whatever tenant context the previous execution left in global state. This is the #1 source of cross-tenant data leaks in multi-tenant applications.

### Real-World Consequences
- Queue job processes all tenants' data instead of one tenant's data — data leak
- CLI cleanup script modifies wrong tenant's data
- Webhook handler associates data with incorrect tenant
- Emergency investigation finds queue worker leaking tenant context across jobs
- Security audit flags cross-tenant data contamination from async operations

### Preferred Alternative
Serialize tenant context into job payloads for queue jobs. Initialize tenant context at the start of CLI commands and webhook handlers. Never rely on session state outside HTTP request context.

### Refactoring Strategy
1. Identify all places where tenant context is read from session
2. For queue jobs: add `$tenantId` property, pass at dispatch, restore in `handle()`
3. For CLI commands: add `--tenant=` option, initialize at command start
4. For webhooks: determine tenant from webhook payload, initialize before processing
5. Add a service provider or middleware that sets tenant context from request for HTTP paths
6. Add monitoring: alert if any tenant-scoped operation runs without tenant context

### Detection Checklist
- [ ] Is tenant context read from the session?
- [ ] Do queue jobs have a `$tenantId` property and restore context?
- [ ] Do CLI commands initialize tenant context?
- [ ] Do webhook handlers determine and set tenant context?
- [ ] Is there any operation that runs without tenant context?

### Related Rules/Skills/Trees
- Don't Store Tenant Context Solely in Session (05-rules.md)
- Configure Shared Database + Global Scopes (06-skills.md)
- Tenant-Aware Queues and Job Context (06-skills.md)

---

## 3. No Composite Unique Indexes

### Category
Data Integrity · Architecture

### Description
Defining unique indexes on columns without including `tenant_id`, causing unique constraint violations across tenants when different tenants create records with duplicate values.

### Why It Happens
Standard Laravel migration patterns create unique indexes on business keys (email, slug, SKU) without considering multi-tenancy. The unique constraint is defined on the column alone: `$table->string('slug')->unique()`. This works in single-tenant but breaks in shared-database multi-tenancy.

### Warning Signs
- Unique indexes defined on single columns without `tenant_id`
- `Integrity constraint violation` errors from different tenants creating same slug
- Unique validation rules don't include `tenant_id` in the check scope
- Manual workarounds adding tenant-specific suffixes to bypass constraints

### Why Harmful
Without `tenant_id` in the unique index, Tenant A creating a blog post with slug `my-post` prevents Tenant B from using the same slug — even though they are separate tenants with separate data. This creates confusing errors, forces data model workarounds, and violates the tenant isolation principle.

### Real-World Consequences
- Tenant B cannot create a post with an available slug — taken by Tenant A
- Unique constraint violations in production — 500 errors for users
- Developer workarounds: appending random suffixes to slugs — ugly URLs
- Data integrity issues when two tenants' records collide on unique values
- Emergency migration to add tenant_id to all unique indexes — requires downtime

### Preferred Alternative
Include `tenant_id` as the first column in every unique index: `$table->unique(['tenant_id', 'slug'])`. This ensures uniqueness is scoped per tenant.

### Refactoring Strategy
1. Identify all unique indexes on tenant-scoped tables
2. For each, create a migration that drops the old index and creates a new composite unique: `(tenant_id, column)`
3. Update validation rules to include `tenant_id` in the unique validation scope
4. Handle existing data conflicts: resolve any cross-tenant duplication before migration
5. Add a CI check that flags unique indexes without `tenant_id` prefix
6. Verify that unique constraint violations no longer occur across tenants

### Detection Checklist
- [ ] Are there unique indexes defined without `tenant_id`?
- [ ] Do validation rules include `tenant_id` in unique checks?
- [ ] Are there cross-tenant unique constraint violations in logs?
- [ ] Does the migration pattern for unique indexes include `tenant_id`?
- [ ] Is there a CI rule preventing tenant-unaware unique indexes?

### Related Rules/Skills/Trees
- Include tenant_id in All Unique Indexes (05-rules.md)
- Configure Shared Database + Global Scopes (06-skills.md)
- Database Schema for Multi-Tenant Applications (06-skills.md)

---

## 4. Auto-Increment IDs Instead of UUIDs

### Category
Security · Architecture

### Description
Using auto-increment primary keys in a shared-database multi-tenant application, allowing tenants to estimate other tenants' data volume and growth rate from sequential IDs.

### Why It Happens
Auto-increment IDs are Laravel's default, simple, and perform better as primary keys than UUIDs. Developers don't consider the information disclosure risk: sequential IDs in API responses leak the total number of records and the rate of new record creation.

### Warning Signs
- Models use `$table->id()` or `$table->bigIncrements('id')`
- API responses include sequential integer IDs
- No UUID column exists on tenant-scoped models
- A tenant can estimate how many total records exist across all tenants
- Growth rate can be calculated from ID progression over time

### Why Harmful
Sequential IDs allow a tenant to determine how many records exist across all tenants by comparing their own latest ID with their first ID. They can also track the application's growth rate. While not a direct data leak, this information can be used by competitors using the same SaaS or to infer business health.

### Real-World Consequences
- Tenant A creates a record with ID 105432 and their first record was ID 5 — they know ~105K total records exist across all tenants
- Competitor using the same SaaS can estimate total customer base
- Sequential IDs enable enumeration attacks: try IDs 1 through 100 to find other tenants' records
- Security audit identifies sequential IDs as an information disclosure finding

### Preferred Alternative
Use UUIDs as primary keys for tenant-scoped models. Laravel offers `$table->uuid('id')->primary()` or the `HasUuids` trait.

### Refactoring Strategy
1. Add the `HasUuids` trait to tenant-scoped models
2. For new tables, use `$table->uuid('id')->primary()` instead of `$table->id()`
3. For existing tables, add a UUID column and migrate to UUID-based routing (complex)
4. Expose only UUIDs in API responses, not auto-increment IDs
5. Remove sequential IDs from API responses and URLs
6. For existing auto-increment systems, keep internal IDs but expose UUIDs externally

### Detection Checklist
- [ ] Do tenant-scoped models use auto-increment IDs or UUIDs?
- [ ] Are sequential IDs exposed in API responses or URLs?
- [ ] Can a tenant estimate total records across all tenants from IDs?
- [ ] Is there a UUID column on tenant-scoped tables?
- [ ] Are API routes using UUID parameters or integer IDs?

### Related Rules/Skills/Trees
- Use UUIDs Instead of Auto-Increment IDs for Multi-Tenant Models (05-rules.md)
- Configure Shared Database + Global Scopes (06-skills.md)
- UUID vs Auto-Increment Decision (07-decision-trees.md)

---

## 5. Unaudited `withoutGlobalScopes()` Usage

### Category
Security · Operations

### Description
Using `withoutGlobalScopes()` to bypass tenant scoping without auditing, documenting, or securing these bypasses, creating unprotected query paths that can leak cross-tenant data.

### Why It Happens
Admin tools often need to see all tenants' data. Testing needs to inspect unfiltered data. Developers use `withoutGlobalScopes()` for convenience without considering that these calls create permanent bypass points. The bypass is not tracked, not secured, and not reviewed.

### Warning Signs
- `withoutGlobalScopes()` appears in non-admin code paths
- No audit log entry exists when `withoutGlobalScopes()` is called
- The bypass is accessible to non-admin users
- No rate limiting or additional authentication on bypass endpoints
- grep for `withoutGlobalScopes` returns many results across the codebase

### Why Harmful
Every call to `withoutGlobalScopes()` is a bypass of the tenant isolation system. If accessible by non-admin users, it's a direct cross-tenant data leak. Even in admin code, unsecured bypasses can be exploited through SSRF, CSRF, or IDOR vulnerabilities.

### Real-World Consequences
- Non-admin user accesses endpoint using `withoutGlobalScopes()` — sees all tenants' data
- SSRF vulnerability in a plugin triggers `withoutGlobalScopes()` — data breach
- Code review misses `withoutGlobalScopes()` in new PR — deployed to production
- CSRF attack on admin tool with scope bypass — cross-tenant data exfiltration

### Preferred Alternative
Audit every `withoutGlobalScopes()` call. Secure admin bypasses with role checks, rate limiting, and audit logging. Use explicit named scopes instead of blanket scope removal.

### Refactoring Strategy
1. Create a searchable index of all `withoutGlobalScopes()` calls in the codebase
2. Audit each call: is it behind admin authentication? Is it necessary?
3. Replace blanket `withoutGlobalScopes()` with explicit scope removal: `withoutGlobalScope('tenant')`
4. Add admin role check before every bypass call
5. Add audit logging: log user, endpoint, and reason for every scope bypass
6. Add rate limiting to bypass-enabled endpoints
7. For admin tools, add a session-based "admin mode" confirmation before allowing bypass

### Detection Checklist
- [ ] How many `withoutGlobalScopes()` calls exist in the codebase?
- [ ] Are all bypass calls secured with admin role checks?
- [ ] Is bypass usage audited (logged)?
- [ ] Are there bypass calls accessible to non-admin users?
- [ ] Is there rate limiting on bypass-enabled endpoints?

### Related Rules/Skills/Trees
- Audit and Secure All withoutGlobalScopes() Calls (05-rules.md)
- Configure Shared Database + Global Scopes (06-skills.md)
- Admin Tenant Scope Bypass Security (06-skills.md)
