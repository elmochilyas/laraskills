# Metadata

Domain: Security & Identity Engineering
Subdomain: Multi-Tenancy Security
Knowledge Unit: Shared-database multi-tenancy with global scopes
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Shared-database multi-tenancy uses a single database where each row is tagged with a `tenant_id` column. Eloquent global scopes automatically filter by the current tenant's ID on every query, preventing cross-tenant data leaks. The `BelongsToTenant` trait or a custom global scope enforces the filter. This is the simplest multi-tenancy model — low operational overhead, easy migrations, single backup — but carries the highest risk of cross-tenant data leaks if any query bypasses the global scope.

---

# Core Concepts

- **Global Scope**: `Illuminate\Database\Eloquent\Scope` applied to a model's `boot()`. Adds `where tenant_id = ?` to every query (including relationships).
- **Tenant ID Column**: Every tenant-scoped table has a `tenant_id` foreign key. Must be `NOT NULL` and indexed.
- **BelongsToTenant Trait**: Custom trait that applies the global scope and auto-fills `tenant_id` on creation from the current tenant context.
- **Tenant Resolution**: Middleware extracts tenant ID from subdomain, header, or authenticated user. Sets the tenant context for the request.
- **Scope Bypass**: `withoutGlobalScope()` and `withoutGlobalScopes()` remove the tenant filter. Used for admin operations and cross-tenant reporting.

---

# Mental Models

- **Row-Level Fence**: Each row's `tenant_id` is an invisible fence. Global scopes ensure you only see rows inside your fence. The fence is soft (can be bypassed with code).
- **Leak Risk**: The global scope is only as reliable as the code. One `withoutGlobalScopes()` too many, one missed scope on a new model, one raw query — and tenant data leaks.

---

# Internal Mechanics

- `Model::addGlobalScope($scope)` registers a scope in the model's `$globalScopes` array.
- On query execution, Laravel iterates `$globalScopes` and calls `apply()` which modifies the query builder.
- `BelongsToTenant` trait: `static::addGlobalScope(new TenantScope)`. `TenantScope::apply()` adds `where tenant_id = ?` using the current tenant ID from `tenancy()->tenantId()`.
- Auto-filling: `static::creating()` callback sets `$model->tenant_id = tenancy()->tenantId()`.
- Cross-model enforcement: ALL models in the tenant scope must have the trait. One model without it is a leak.

---

# Patterns

## Centralized Tenant Scope Pattern
- **Implementation**: Base model class or trait that all tenant-scoped models extend/use. Single point of scope application.
- **Benefits**: One place to audit. If you see a model without the trait, you know it's not tenant-scoped.
- **Tradeoffs**: Models need to extend the base class — may conflict with other model inheritance.

## Dual Scope for Shared/Isolated Models
- **Implementation**: Some models are tenant-scoped (posts, comments), some are global (countries, settings). Use the trait only for tenant-scoped models.
- **Benefits**: Clear separation. Global models are not accidentally scoped.
- **Tradeoffs**: Developer must remember which are which.

## Admin Bypass with Audit Pattern
- **Implementation**: Admin operations that query across tenants explicitly call `withoutGlobalScopes()` and log the operation. Audit log includes "admin accessed all tenants' data."
- **Benefits**: Every cross-tenant query is intentional and auditable.
- **Tradeoffs**: Audit log bloat from frequent admin operations.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Global scope trait vs manual `whereTenant()` | Automatic vs explicit scoping | Global scope for safety (forgetting manual where is a leak). Manual where only for very few models |
| Soft vs hard tenant enforcement | Eloquent-only vs DB-level | Soft (Eloquent) for agility. Hard (PostgreSQL RLS) for compliance — RLS enforces at the database level even for raw queries |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Single database = easy migrations, backup, operations | Global scope bypass = cross-tenant data leak | One `withoutGlobalScopes()` on a controller reading "all users" leaks every tenant's user data |
| Eloquent scope is invisible (automatic) | Raw queries bypass the scope entirely | Any `DB::table()` or raw query does NOT apply the global scope → potential leak |
| Tenant ID index makes queries fast | Every query has an additional WHERE clause | At millions of rows, the tenant filter is the most important performance factor |

---

# Performance Considerations

- Global scope adds `WHERE tenant_id = ?` to every query. With proper index, this is the fastest query path (high cardinality, equality filter).
- Composite indexes should start with `tenant_id`: `INDEX(tenant_id, created_at)`.
- `withoutGlobalScopes()` does not affect query performance — it simply removes the WHERE clause.

---

# Production Considerations

- **CI Test for Scope Coverage**: Automated test that checks every User query includes a tenant scope. Catch missing scopes before production.
- **Index Verification**: Migration checks ensure all tenant-scoped tables have `tenant_id` index. Run `db:check-indexes` in CI.
- **Admin Impersonation Tools**: Admin tools that switch tenants must properly re-apply the global scope for the target tenant. Failing to re-apply shows admin's own tenant data, not the target tenant's.
- **Database Constraints**: Enforce `tenant_id` foreign key to `tenants` table (if using a tenant model). Prevents orphaned rows when a tenant is deleted.

---

# Common Mistakes

- **New model created without tenant scope**: Developer adds a `Comments` model but forgets the trait. Comments are visible to all tenants. Add to code review checklist.
- **Nested relationship without tenant scope**: `$user->posts` — `Post` has the trait, but `$user` is not tenant-scoped. Query fetches users from all tenants, then loads posts for those users (posts are scoped, but users are not).
- **Raw queries bypassing scope**: `DB::table('posts')->get()` does not apply Eloquent scopes. Use `Post::all()` instead.
- **Reusing model instances across tenants**: In Octane/Swoole, a model loaded in tenant A's request is cached. Next request (tenant B) reads the same model — A's data exposed to B. Solution: use tenant-cache prefix or model fresh queries.

---

# Failure Modes

- **Missing tenant_id on create**: If tenant context is lost (session expired, middleware didn't run), `tenant_id` is null. The record is invisible to all tenants (global scope filters `WHERE tenant_id = ?` and `NULL != ?`). Mitigation: set `tenant_id` as `NOT NULL` in database.
- **Global scope not applied to aggregated queries**: `User::where('active', true)->toSql()` — the global scope adds `WHERE tenant_id = ? AND active = ?`. But `DB::table('users')->where('active', true)` has no tenant filter. Always use models.
- **Over-scoping**: Admin model also has the tenant scope. Admin users are scoped to their tenant and cannot manage other tenants. Admin model should NOT have the tenant scope.

---

# Related Knowledge Units

- Prerequisites: Eloquent global scopes, Eloquent model events
- Related: Database-per-tenant isolation pattern, stancl/tenancy package architecture
- Advanced Follow-up: PostgreSQL Row-Level Security for hard tenant enforcement, Tenant-aware caching strategies, Cross-tenant data leak detection testing

## Ecosystem Usage
- **Stancl Tenancy**: Full multi-tenancy package with database-per-tenant and single-database scoping; integrates with Laravel's queue, cache, filesystem, and mail systems via bootstrappers. Provides automatic domain-based tenant resolution.
- **Database-per-tenant**: Each tenant gets an isolated database; connection is switched at runtime based on tenant context. Requires migration automation for new tenants and cross-tenant query complexity.
- **Shared database scopes**: Single database with tenant-scoped Eloquent queries; global scopes (ddGlobalScope) automatically filter by tenant ID. Requires careful query design to prevent cross-tenant data leaks.
- **Tenant-aware queues**: Jobs dispatched within tenant context include tenant identifiers in job payload; queue workers reinitialize tenant context before executing tenant-scoped jobs.
- **Multi-tenancy audit separation**: Audit logs separated by tenant using named logs, separate database connections, or partitioned audit tables. Prevents cross-tenant audit data exposure.
- **Tenant isolation boundaries**: Stancl tenancy uses TenantManager to initialize tenant context; bootstrappers configure database, cache, filesystem, and mail settings per-tenant. Middleware handles tenant resolution per-request.
- **Cross-tenant resource sharing**: Cache prefixing, filesystem directory isolation, and session namespace separation prevent cross-tenant data leakage in shared infrastructure.
- **Stancl tenancy panel integration**: Filament and Nova multi-tenancy support via middleware and tenant-scoped resources; admin panels display data scoped to the current tenant context.

## Research Notes
- Stancl tenancy v4+ introduced event-based tenant lifecycle management — tenant creation, database migration, and domain configuration are handled through events (TenantCreated, TenantMigrated, TenantDomainCreated), enabling custom logic at each lifecycle stage.
- Database-per-tenant security isolation provides stronger guarantees than shared-database scoping — a SQL injection vulnerability in one tenant's scope cannot access another tenant's data when databases are physically separated.
- Tenant-aware queue serialization in Stancl tenancy includes tenant identifiers in the job payload — the queue worker reinitializes the tenant context using TenantManager::setCurrentTenant() before job execution.
- Shared-database scoping requires global scope (ddGlobalScope) and middleware (IdentifyTenant) to enforce tenant isolation — the most common vulnerability in shared-scope setups is forgetting to apply global scopes to query builder queries.
- The 	enant_id column in shared-database schemas must be part of all unique indexes — otherwise, data from different tenants can conflict on unique constraints, causing false duplicate entry errors.
- Redis key prefixing in multi-tenancy (via stancl/tenancy bootstrapper) prevents cross-tenant cache pollution — each tenant's cache keys are prefixed with the tenant ID, isolating cache namespaces.
- Multi-region tenant deployment adds compliance complexity — tenant data must remain in the chosen geographic region, and cross-region administrative access must be audited for GDPR compliance.
- Community patterns for multi-tenant audit logging focus on either per-tenant databases (strongest isolation) or per-tenant named logs (logical separation within a shared audit database).

## Internal Mechanics
- **Stancl Tenancy Initialization Flow**: HTTP request arrives → Stancl\Tenancy\Middleware\InitializeTenancyByDomain middleware extracts the domain from the request → queries central database for tenant matching the domain → calls Tenancy::initialize() → runs bootstrappers in configured order (database connection, cache prefix, filesystem root, mail config) → tenant context is active for the remainder of the request.
- **Database-per-Tenant Connection Switching**: When tenant is initialized, DatabaseTenancyBootstrapper creates a new database connection with tenant-specific credentials/configuration → sets it as the default connection → all subsequent Eloquent queries use this connection. The connection is reverted to the central connection after the request completes.
- **Shared Database Scoping**: Global scope (Illuminate\Database\Eloquent\Scope) is registered via ddGlobalScope on the model's ooted() method → every query on that model automatically includes WHERE tenant_id = ? clause → the scope reads the current tenant ID from the request context or tenant manager.
- **Queue Serialization for Tenant Context**: When a job is dispatched within a tenant context, the tenant ID is serialized into the job payload → ShouldQueue middleware captures the tenant ID via Tenancy::getTenant() → when the worker processes the job, the TenantAwareJob middleware reinitializes the tenant context before handle() executes.
- **Bootstrapper Execution Order**: Stancl\Tenancy\Tenancy::initialize() executes bootstrappers sequentially from the $bootstrappers config array → each bootstrapper's ootstrap(Tenant ) method is called → bootstrappers configure database, cache, filesystem, and other services for the tenant context.
- **Central Database Tenant Storage**: Tenant records are stored in a central database (separate from tenant databases) → the central 	enants table stores tenant configuration (domain, database name, connection details) → the central system is always accessible regardless of tenant context.
