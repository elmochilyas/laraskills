# Metadata

Domain: Security & Identity Engineering
Subdomain: Multi-Tenancy Security
Knowledge Unit: Database-per-tenant isolation pattern
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Database-per-tenant multi-tenancy gives each tenant an isolated database. Connection switching happens at the middleware level — the tenant's database connection is resolved based on subdomain or user and set as the default connection for the request. This provides the strongest data isolation (no global scope bypass risk, no cross-tenant SQL injection), at the cost of operational complexity (N databases to migrate, monitor, backup). Each tenant gets their own full schema, making it impossible for a query or bug to leak data across tenants at the database level.

---

# Core Concepts

- **Per-Tenant Database Connection**: Each tenant has a separate database. Connection configuration stored in `config/database.php` or dynamically generated at runtime.
- **Connection Switching Middleware**: Resolves tenant → database config → sets `config('database.default')` to tenant's connection name.
- **Central Database**: A separate "central" database stores tenant records (hostname, database name, credentials). The `tenants` table lives here.
- **Migration Strategy**: Each tenant database runs migrations independently. New tenants start from the latest migration state.
- **Backup Strategy**: N databases = N backups. Each tenant can be restored independently without affecting others.

---

# Mental Models

- **Fortress Model**: Each tenant is in their own fortress. There is no shared gate (global scope) that can be accidentally left open. To access tenant B's data, you must explicitly connect to tenant B's database.
- **Operational Multiplier**: Everything that operates on "the database" now operates N times (migrations, backups, monitoring, schema changes).

---

# Internal Mechanics

- `config(['database.connections.tenant' => $tenantDbConfig])` at runtime. Then `DB::purge('tenant')` and `DB::reconnect('tenant')`.
- `config(['database.default' => 'tenant'])` — subsequent `DB::` and Eloquent calls use the tenant connection.
- Central database: separate connection named `central`. Used for tenant lookup: `Tenant::where('domain', $request->getHost())->first()`.
- Queue jobs: serialize the `tenant_id` and re-initialize the tenant database connection in the job's `handle()`.

---

# Patterns

## Tenant Middleware Connection Switch
- **Implementation**: Middleware reads subdomain, looks up tenant in central DB, sets dynamic connection config, switches default.
- **Benefits**: Transparent connection switching. Controllers use standard Eloquent — no tenant awareness in business logic.
- **Tradeoffs**: Middleware runs on every request. Tenant lookup adds a central DB query.

## Tenant-Aware Migration Command
- **Implementation**: Custom `php artisan migrate:tenant --tenant=123` that runs migrations on a specific tenant's database. Batch command: `php artisan migrate:all-tenants`.
- **Benefits**: One command to migrate all tenants. Rollback per tenant if needed.
- **Tradeoffs**: N times slower than a single migration. Run asynchronously for many tenants.

## Tenant-Specific Backups
- **Implementation**: Each tenant database backed up on its own schedule (enterprise: daily, free: weekly). Backup command accepts `--tenant` or `--all`.
- **Benefits**: Ransomware affecting one tenant does not affect others. Restore one tenant without touching others.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Database-per-tenant vs shared DB | Regulatory isolation vs operational simplicity | DB-per-tenant for regulated industries (healthcare, finance). Shared DB for most SaaS apps |
| Separate database server per tenant vs shared server | Complete isolation vs cost | Shared database server (multiple databases) for cost efficiency. Separate servers only for enterprise tenants |
| Dynamic connection vs config file | Runtime config vs deploy-time config | Dynamic connection (set in middleware) — no deployment needed for new tenants |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Strongest isolation — no cross-tenant data leak possible | N databases to manage, migrate, back up | Operational complexity scales linearly with tenant count |
| Restore one tenant independently | New tenants start with schema migrations | 1000th tenant migration on a 100-table schema = 1000 ops × 100 tables = time-consuming |
| Tenant-specific schema customization possible | Schema drift between tenants | Custom per-tenant schema changes make migrations and support harder |

---

# Performance Considerations

- Database connection switching is fast (config array change + `DB::purge()` + `DB::reconnect()`). ~5-10ms overhead per request.
- Connection pool: each tenant connection is a separate database connection. At 100 concurrent requests for 100 different tenants = 100 database connections. Monitor connection limits.
- Query performance is same as single-tenant app — no tenant WHERE clause needed.

---

# Production Considerations

- **Migration Rollout**: Schema changes must be applied to ALL tenant databases. Use a batch artisan command that runs migrations asynchronously. Monitor failed migrations per tenant.
- **Central Database HA**: The central database (tenant registry) is a single point of failure. If it's down, no request can resolve which tenant database to use. Replicate or cache tenant records.
- **Connection Limits**: Each tenant database has its own connection limit. A busy tenant can exhaust its database connections. Set per-tenant connection pool limits.
- **Monitoring**: Monitor per-tenant database health (connections, query performance, disk usage, replication lag). Alert on per-tenant anomalies.

---

# Common Mistakes

- **Missing connection purge**: Setting `config()` but not calling `DB::purge()` — the old connection is still cached. New queries still hit the old tenant's database.
- **Stale Eloquent model cache**: A model loaded in tenant A's request is cached (query results cache). Next request (tenant B) reads the cached model from tenant A. Solution: per-tenant cache prefix or disable query cache for tenant models.
- **Forgetting tenant context in queue jobs**: Job dispatched during tenant A's request, processed later without restoring tenant A's connection. The job writes to the default (central) database instead of tenant A's database.
- **Sharing database user between tenants**: If tenant A's database user can connect to tenant B's database (same credentials on shared server), an application bug could query tenant B's database. Use per-tenant database credentials.

---

# Failure Modes

- **Central Database Down**: Tenant lookup fails. Application cannot determine which database to use. All requests fail. Mitigation: cache tenant-to-database mapping in Redis with long TTL. Fall back to cache if central DB is down.
- **Tenant Connection Throttling**: A tenant with heavy traffic exhausts their database connection pool. Other tenants are unaffected (different databases), but the busy tenant's users see connection errors.
- **Schema Drift**: One tenant's migration fails. That tenant's schema is behind. Application code assumes latest schema — errors on the drifted tenant. Monitor migration completion per tenant.

---

# Related Knowledge Units

- Prerequisites: Database connection configuration, Migration management
- Related: Shared-database multi-tenancy with global scopes (alternative pattern), Tenant-aware queues and job context
- Advanced Follow-up: Database-per-tenant migration strategies, Central database HA patterns, Per-tenant database credential rotation

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
