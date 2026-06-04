# Metadata

Domain: Security & Identity Engineering
Subdomain: Multi-Tenancy Security
Knowledge Unit: Tenant-aware queues and job context
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Tenant-aware queues ensure that background jobs execute in the correct tenant context, preventing cross-tenant data contamination and authorization bypasses. Every job dispatched during a tenant request must carry the `tenant_id` in its serialized payload, and the job handler must re-initialize the tenant context (database connection, cache prefix, storage disk, global scope) before processing. The most common cross-tenant leak pattern is a queue job written during tenant A's request that executes without tenant context and writes data to the wrong tenant's database.

---

# Core Concepts

- **Tenant Context Serialization**: Every job dispatched from a tenant-scoped request includes the tenant ID in its `__construct` parameters or serialized properties.
- **Context Restoration**: The job's `handle()` method calls `tenancy()->initialize($this->tenantId)` to restore the tenant environment (connection, cache, storage, auth).
- **Queue Worker Isolation**: The queue worker runs without a tenant context by default. It must be explicitly told which tenant to process for.
- **Horizon Per-Tenant Queues**: Separate queues per tenant for fair scheduling. A busy tenant does not starve other tenants' jobs.
- **Failed Job Context**: When a tenant job fails, the failure must be logged with tenant context for debugging.

---

# Mental Models

- **Context as Passport**: The tenant ID is the job's passport. Without it, the job belongs nowhere. With the wrong passport, it belongs to the wrong country.
- **Stateless Worker Pattern**: Queue workers are stateless — they hold no tenant context between jobs. Each job starts fresh, initializes its tenant, processes, cleans up.

---

# Patterns

## Mandatory Tenant Trait on Jobs
- **Implementation**: Job base class or trait that requires `$tenantId` in constructor. `handle()` calls `tenancy()->initialize($this->tenantId)`. If `$tenantId` is null, the job fails with `TenantContextMissingException`.
- **Benefits**: No job can run without tenant context. Missing context is immediately detected.
- **Tradeoffs**: Every job must include tenant ID — even system jobs that don't need it.

## Tenant-Aware Queue Routing
- **Implementation**: `dispatch()->onQueue('tenant-'.$tenantId)` — each tenant has a dedicated queue. Horizon workers assigned per tenant queue.
- **Benefits**: Tenant isolation — tenant A's job backlog does not delay tenant B's jobs.
- **Tradeoffs**: N queues for N tenants. Horizon dashboard becomes noisy.

## Context Cleanup via Finally Block
- **Implementation**: Job handler wraps logic in `try ... finally { tenancy()->end() }`. Ensures tenant context is always cleaned up, even on exception. Prevents context leaking to the next job in a long-running worker (Octane, Horizon).
- **Benefits**: No context leak between jobs in the same worker process.
- **Tradeoffs**: Boilerplate in every job. Can be abstracted into a base job class.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Per-tenant queue vs shared queue | Fairness vs simplicity | Shared queue with `tenant_id` tagging for most. Per-tenant queues for large tenants or SLA-guaranteed processing |
| Tenant context initialization in job vs middleware | Granular vs centralized | Job trait (per-job) for flexibility; Horizon middleware (global) for consistency |
| Fail on missing tenant vs fallback to system | Safety vs resilience | Fail on missing tenant — no fallback. A job without tenant context must not write to ANY tenant's data |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Tenant isolation prevents cross-tenant data leaks in async processing | Every job must explicitly handle tenant context | New job classes must implement the tenant trait — easy to forget |
| Per-tenant queues provide fair processing | N queues = N Horizon processes to manage | Operational overhead for 1000+ tenants |
| Context cleanup prevents leaks in long-running workers | Additional boilerplate in job handler | Abstract into base class to reduce repetition |

---

# Performance Considerations

- Tenant initialization in each job: database connection config + cache prefix set + global scope property set. ~2-5ms per job.
- Per-tenant queues: Horizon workers polling N queues. Each worker keeps an idle connection to its queue. At 1000 tenants, this is 1000 idle queue connections.
- Context cleanup: `tenancy()->end()` may flush cache, disconnect databases. Ensure cleanup is fast.

---

# Production Considerations

- **Horizon Tagging**: Tag Horizon jobs with tenant ID for monitoring: `Horizon::tag('tenant:'.$this->tenantId)`.
- **Failed Job Monitoring**: Horizon shows failed jobs. Include `tenant_id` in the job display name or tags so support can identify which tenant's job failed.
- **Job Retry with Context**: When a job is retried (failed, retried), the tenant context must be restored identically. The `$tenantId` property is serialized — it survives retries.
- **Batch Dispatching**: Dispatching 1000 jobs, each for a different tenant. Each job must carry its own `tenant_id`. Group dispatch: `collect($tenants)->each(fn($t) => ProcessTenantJob::dispatch($t->id))`.

---

# Common Mistakes

- **Dispatching a job without tenant ID from a tenant request**: `ProcessReport::dispatch()` without passing `$tenantId`. The job processes with whatever default connection exists on the worker — likely the wrong tenant's database.
- **Assuming tenant context persists across jobs**: A job initializes tenant A, processes, finishes. The next job on the same worker does NOT inherit tenant A's context (if cleanup is properly implemented). But if cleanup is missing, the second job B accidentally uses tenant A's context — cross-tenant write.
- **Not testing tenant isolation for queue jobs**: Unit test passes. Integration test passes single-tenant. But multi-tenant queue scenario (tenant A dispatches job, processed with tenant B context) is not tested.
- **Reusing Eloquent models across tenant contexts**: A model loaded during dispatch (tenant A) is serialized into the job payload. The job deserializes it and saves it in tenant B's database — saving tenant A's data into tenant B. Always pass IDs, not models.

---

# Failure Modes

- **Stale Tenant Context in Long-Running Worker**: A Horizon worker processed tenant A's job. `tenancy()->end()` was not called (exception path). Next job, tenant B, runs in tenant A's database context → tenant B's data written to tenant A's database. Mitigation: `try/finally` with context cleanup.
- **Serialized Model Cross-Contamination**: Job receives `$post` (model instance, serialized with `tenant_id = 1`). Job saves `$post` in tenant 2's database context. The `tenant_id` on the model is 1, but it's now in tenant 2's database. Always pass ID + re-fetch in job.
- **Queue Worker Without Tenant Support**: A worker that processes tenant-tagged jobs but does not initialize tenant context. All jobs run in the "default" database (likely central). Data ends up in the wrong place.

---

# Related Knowledge Units

- Prerequisites: Queue basics (jobs, workers, Horizon), Multi-tenancy fundamentals
- Related: Shared-database multi-tenancy with global scopes, Database-per-tenant isolation pattern
- Advanced Follow-up: Horizon per-tenant queue configuration, Job batching with tenant context, Octane + Queue tenant context safety

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
