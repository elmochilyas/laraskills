# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.8 Tenant-aware commands (--tenant option, batch processing)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Artisan commands in multi-tenant apps must support per-tenant or all-tenant execution. A `--tenant` option selects a specific tenant. No option means process all tenants in a loop. Each tenant iteration rebinds context before running tenant-specific logic.

---

# Core Concepts

- **--tenant option**: Accepts tenant ID. Single-tenant mode allows targeted maintenance, debugging, or backfill.
- **Batch mode**: With no `--tenant`, iterate all tenants, rebind context per iteration, run command logic.
- **Progress feedback**: Use `$this->output->progressStart(count($tenants))` for visibility in batch mode.

---

# Patterns

**TenantCommand base class**: Abstract command with `getTenants()` and `handleTenant(Tenant $tenant)` methods. Batch command just calls `handleTenant` in a loop.

**Error isolation**: `try/catch` per tenant in batch mode. One tenant failure doesn't stop processing for others.

---

# Common Mistakes

**No progress output**: Multi-tenant commands processing 1000+ tenants run for hours with no feedback. Always show progress.

---

# Related Knowledge Units

5.7 Tenant-aware queue jobs | 5.9 Migration orchestration
## Ecosystem Usage

The stancl/tenancy package dominates Laravel multi-tenancy. Three approaches: shared-table with global scopes, schema-per-tenant, and database-per-tenant. PostgreSQL row-level security offers database-enforced tenant isolation.

## Failure Modes

Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Performance Considerations

Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Production Considerations

Implement canary rollout for migrations. Monitor noisy neighbor tenants. Use connection health checks. Implement per-tenant backup strategies.

## Research Notes

PostgreSQL schema-per-tenant with RLS is increasingly favored. Connection pooling continues to improve. The community trend is toward database-per-tenant for SaaS.

## Internal Mechanics

stancl/tenancy leverages Laravel's queue and connection management. Tenant resolution happens in middleware by matching hostname against a central database. Global scopes apply to Eloquent queries at model boot time.

## Architectural Decisions

Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Tradeoffs

Shared-table simplicity comes with cross-tenant leak risk. Database isolation provides safety but connection overhead. Schema-per-tenant balances isolation and complexity.

## Mental Models

Each tenant is a separate silo. Shared-table = cubicle walls. Schema-per-tenant = office walls. Database-per-tenant = separate buildings. Choose based on tenant trust requirements.

