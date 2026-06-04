# Metadata

Domain: Security & Identity Engineering
Subdomain: Multi-Tenancy Security
Knowledge Unit: stancl/tenancy package architecture
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

`stancl/tenancy` is the gold-standard multi-tenancy package for Laravel, supporting both single-database (tenant_id scoping) and multi-database (per-tenant databases) isolation patterns. Its architecture centers on a `Tenant` model, customizable bootstrappers (classes that initialize tenant context: database, cache, filesystem, Redis, mail, etc.), and automatic middleware-based tenant resolution. The package handles the full lifecycle: tenant creation → database migration → domain resolution → context initialization → queue context serialization → tenant teardown.

---

# Core Concepts

- **Tenant Model**: Eloquent model implementing `Stancl\Tenancy\Contracts\Tenant`. Stores tenant data (domains, database name, etc.) in a central database.
- **Bootstrappers**: Classes that configure the tenant environment. Default set: database connection, cache prefix, Redis prefix, filesystem root, mail configuration. Custom bootstrappers can be added.
- **TenantMiddleware**: Resolves tenant by subdomain, domain, or path prefix. Sets the tenant context via `tenancy()->init($tenant)`.
- **Database Models**: Central DB (`tenants` table + domain records). Per-tenant DB (full application schema). Configurable via `tenancy.php`.
- **Events**: `TenancyBootstrapped`, `TenancyEnded`, `TenantCreated`, `TenantDeleted`, etc. Hook into lifecycle for custom logic.
- **Queue Integration**: `ShouldQueue` + `$tenantId` property pattern. The package provides traits and serialization support for tenant-aware jobs.

---

# Mental Models

- **Tenancy as State Machine**: The package treats tenancy as a request-scoped state. `tenancy()->init()` starts the state; `tenancy()->end()` cleans up. All bootstrappers run during init, all revert during end.
- **Bootstrapper Pipeline**: Like middleware for tenant initialization. Each bootstrapper sets up one aspect of the environment. Custom bootstrappers slot into the pipeline.

---

# Internal Mechanics

- **Tenant Identification**: Middleware reads `Host` header → matches against `domains` table in central DB → retrieves `Tenant` model → calls `tenancy()->init($tenant)`.
- **Init Flow**: Sets current tenant on `TenantManager` → runs `BootstrapperQueue` (ordered list of bootstrappers) → each bootstrapper modifies config (database, cache, etc.).
- **Database Bootstrapper**: For single-DB: sets `config('database.connections.tenant.database')`. For per-DB: creates connection config dynamically, sets it as default.
- **Cache Bootstrapper**: Sets cache prefix to `{tenant_id}_` — prevents cross-tenant cache reads.
- **Queue Payload Serialization**: The package hooks into queue serialization to include tenant ID in job payload. On job processing, it re-initializes the tenant context.
- **End Flow**: Reverts all bootstrapper changes → clears current tenant.

---

# Patterns

## Custom Bootstrapper Pattern
- **Purpose**: Initialize middleware, storage disk, or third-party service per tenant.
- **Implementation**: Create a class implementing `Stancl\Tenancy\Contracts\Bootstrapper`. Add to `tenancy.bootstrappers` config.
- **Benefits**: Consistent tenant initialization for all tenant-specific services.
- **Tradeoffs**: Must handle both init and revert (revert is often missed, causing context leak).

## Domain-Based Tenant Resolution
- **Purpose**: Each tenant has a unique domain.
- **Implementation**: `tenancy.host_middleware` resolves from `Host` header. `tenant1.example.com` → Tenant 1.
- **Benefits**: Clean URL. Standard HTTP host resolution.
- **Tradeoffs**: DNS management per tenant. Wildcard DNS required.

## Per-Tenant Database Migration
- **Purpose**: Each tenant gets a migrated database.
- **Implementation**: `tenancy:migrate` command runs migrations on all tenant databases (or a specific tenant). `tenancy:rollback`, `tenancy:seed` similarly.
- **Benefits**: Independent schema management per tenant.
- **Tradeoffs**: Migration time scales with tenant count. Consider async migration for 1000+ tenants.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| stancl/tenancy vs spatie/laravel-multitenancy | Feature-rich vs lightweight | stancl/tenancy for most apps (more features, larger community). spatie for simple single-DB multi-tenancy |
| Single-DB vs per-DB | Simplicity vs isolation | Single-DB with stancl/tenancy for cost efficiency; per-DB for compliance |
| Auto-migration on tenant create vs manual | Convenience vs control | Auto-migration for SaaS onboarding; manual for controlled environments |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Comprehensive feature set (DB, cache, queue, storage, mail) | Heavy abstraction — learning curve | Understanding all bootstrappers and their interactions takes time |
| Queue integration handles tenant context | Package must hook into serialization | Queue driver upgrades may break serialization hooks |
| Active community and maintenance | Major version upgrades require migration effort | v3 → v4 migration was significant. Plan upgrade windows |

---

# Performance Considerations

- Bootstrapper overhead: 5-15ms per request. Each bootstrapper modifies config array — negligible.
- Per-tenant DB mode: creating a new connection (`DB::purge` + `DB::reconnect`) adds ~5ms per request.
- Cache prefix per tenant ensures isolated cache — but cache misses require separate warmup per tenant.
- Queue context serialization adds payload size. Minimal overhead.

---

# Production Considerations

- **Bootstrapper Order**: The bootstrapper order matters. Database must be initialized before other bootstrappers that query the database. Default order is correct for most apps.
- **Tenant Cache Warmup**: After `tenancy:seed`, run `tenancy:cache-warm` to pre-warm cache for each tenant. Otherwise, the first request per tenant after deployment is slow.
- **Central Database HA**: The central database (tenants, domains tables) is critical. If it's unavailable, no tenant can connect. Use read replicas or caching for tenant lookup.
- **Domain Changes**: Changing a tenant's domain requires updating the `domains` table. The package re-resolves on every request (no persistent DNS cache).

---

# Common Mistakes

- **Incorrect bootstrapper order**: Database bootstrapper runs after a bootstrapper that queries the database. The query fails because the connection is not yet set. Ensure DB-dependent bootstrappers are ordered after the database bootstrapper.
- **Not cleaning up tenant context in Octane**: Octane reuses the container across requests. `tenancy()->end()` must be called. The package has Octane integration, but verify it's enabled.
- **Forgetting to exclude central routes from tenant middleware**: Routes that manage tenants (create, list) must NOT run tenant middleware. The package provides `Route::middleware('central')`.
- **Using the same cache driver for central and tenant data**: Central tenant records cached under the same cache prefix as tenant data can confuse. Use separate cache stores or ensure cental cache is not tenant-prefixed.

---

# Failure Modes

- **Bootstrapper Revert Failure**: A bootstrapper's `revert()` method partially fails, leaving stale config (e.g., database connection from tenant A). Next request (tenant B) uses tenant A's database connection. Mitigation: hard-reset the connection on each request rather than reverting.
- **Tenant Migration Timeout**: Migrating 500 tenant databases sequentially takes 30+ minutes. New deployments have long downtime. Use async migration with queued tenant migration jobs.
- **Central DB Connection Pool Exhaustion**: Tenant lookup queries the central database. At 1000 concurrent requests, the central DB connection pool may exhaust. Separate central DB connection pool from tenant connections.

---

# Related Knowledge Units

- Prerequisites: Shared-database multi-tenancy with global scopes, Database-per-tenant isolation pattern
- Related: Tenant-aware queues and job context, Multi-tenant audit logging
- Advanced Follow-up: stancl/tenancy Octane configuration, Custom bootstrapper development, Tenant migration strategies at scale

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
