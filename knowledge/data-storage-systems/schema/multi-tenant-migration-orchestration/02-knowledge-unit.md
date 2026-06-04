# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.21 Multi-tenant migration orchestration (per-tenant DB, sequential/parallel, queued)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

In multi-tenant architectures with per-tenant databases, running migrations requires fan-out across potentially hundreds or thousands of databases. Orchestration strategies include sequential (one tenant at a time), parallel (batch concurrency), and queued (each tenant's migration as a job). The choice determines total migration time, resource usage, and failure handling complexity.

---

# Core Concepts

- **Fan-out problem**: A single `php artisan migrate` applies to one database. With N tenant databases, the migration must run N times.
- **Sequential fan-out**: Loop through tenants, run migration on each. Total time = N * time_per_migration. Simple but slow for 1000+ tenants.
- **Parallel fan-out**: Run migrations on multiple tenants concurrently. Batch size limits concurrency. Faster but requires connection pool management.
- **Queued fan-out**: Each tenant's migration is a separate queue job. Workers process tenant migrations in parallel. Includes built-in retry and failure handling.
- **Canary rollout**: Migrate a subset of tenants (1-5%) first, verify, then roll out to all tenants.

---

# Mental Models

Multi-tenant migration orchestration is a batch job scheduling problem. Each tenant database is a work unit. The orchestrator must handle partial success, retry, failure isolation, and progress tracking.

---

# Internal Mechanics

**Package-supported (stancl/tenancy)**:
- `php artisan tenants:migrate` iterates over all tenants.
- Can accept `--tenant` option for a single tenant.
- Runs migrations within each tenant's database connection context.
- Supports rollback per tenant.

**Custom orchestration**:
- Fetch all tenant records from the central database.
- For each tenant, set the connection config dynamically, run the migrator.
- Wrap in try/catch for per-tenant failure isolation.

---

# Patterns

**Queued migration per tenant**: Instead of an Artisan command, dispatch a `RunTenantMigration` job per tenant. Horizon workers process them. Benefits: parallel processing, automatic retry, rate limiting, failure isolation.

**Canary tenants**: Run migrations on a small group of "canary" tenants first. Monitor for errors, schema inconsistencies, and performance degradation before rolling to all tenants.

**Tenant migration version ledger**: Maintain a `schema_versions` table in the central database tracking which schema version each tenant is on. This enables per-tenant migration management.

---

# Architectural Decisions

| Strategy | Total Time (1000 tenants) | Complexity | Risk |
|----------|--------------------------|------------|------|
| Sequential | ~17 hours (1 min each) | Low | Simple, slow |
| Parallel (10 at a time) | ~1.7 hours | Medium | Connection pool exhaustion |
| Queued (50 workers) | ~20 minutes | Medium-High | Queue infrastructure dependency |
| Canary + Queued | ~25 minutes | High | Safest, requires monitoring |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Sequential: no connection overload | Extremely slow for many tenants | Deployment window may be insufficient
Parallel: fast migration | Database server resource contention | Monitor CPU and connection count
Queued: built-in retry and isolation | Queue infrastructure required | Higher operational complexity
Canary: safety validation | Slower total rollout | Two-stage deploy process

---

# Performance Considerations

- Each tenant migration creates its own database connection. With parallel approaches, connection count = concurrency * connections_per_migration.
- Large tenants take longer to migrate (more rows to scan for DDL validation). Sequential ordering can put large tenants first to avoid blocking small tenant migrations.
- PostgreSQL's concurrent DDL operations (CREATE INDEX CONCURRENTLY) should be used per-tenant for large indexes.

---

# Production Considerations

- **Calculate total migration time**: Multiply the migration duration on a test tenant by the number of tenants. If the total exceeds the deployment window, use parallel or queued strategies.
- **Per-tenant rollback**: A migration may succeed on 999 tenants and fail on 1. The system must support rolling back that single tenant without affecting the others.
- **Lock management**: Use `--isolated` per-tenant to prevent concurrent migrations on the same tenant database from different processes.

---

# Common Mistakes

**Running all tenant migrations in one transaction**: A single failure rolls back the entire batch, undoing successfully migrated tenants. Wrap each tenant migration in its own transaction.

**Not testing on a subset first**: A migration that works on a small tenant database with 10K rows may time out on a large tenant with 100M rows.

**Ignoring tenant database versions**: Not all tenants may be at the same schema version. The orchestrator must handle tenants with pending migrations correctly.

---

# Failure Modes

- **Partial rollout failure**: 50 tenant databases fail to migrate. The system is in a mixed state — some tenants on new schema, others on old. Application code must be forward-compatible.
- **Connection pool exhaustion**: Running 100 parallel tenant migrations opens 100+ database connections simultaneously, exceeding the database server's max_connections.
- **Tenant outage during long migration**: During a migration that modifies a large table on a large tenant, other operations on that tenant's database are blocked or slowed.

---

# Related Knowledge Units

5.9 Migration orchestration across tenants | 5.19 Schema version ledger per tenant | 5.29 Tenant migration canary rollout

---

# Ecosystem Usage

The stancl/tenancy package is the most widely used multi-tenant migration orchestrator in the Laravel ecosystem, supporting the `tenants:migrate` command for fan-out across tenant databases. For very large deployments (> 5000 tenants), companies like Spin and Teamwork have built custom orchestration layers using Laravel's queue system with per-tenant job dispatching. The `--tenant` option allows targeted migrations for canary testing. Platform.sh and Laravel Cloud provide infrastructure-level support for per-tenant migration workflows. The `tenants:rollback` command mirrors the fan-out approach for safe schema reverts.

# Research Notes

Queued per-tenant migrations with canary rollout is the safest pattern for 100+ tenant deployments. Stancl/tenancy provides built-in support but has limitations for very large tenant counts (> 5000). Custom orchestrators using the queue with per-tenant connection management offer more control but require significant development effort.
