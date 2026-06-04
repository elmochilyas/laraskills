# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.22 Migration version ledger per tenant (schema_version tracking)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

In multi-tenant environments with per-tenant databases, each tenant's schema version must be tracked independently. A central `schema_versions` table (or equivalent) in the control database records which migrations have been applied to which tenant. This enables per-tenant rollbacks, staggered rollouts, canary testing, and schema drift detection.

---

# Core Concepts

- **Schema version ledger**: A table in the central database with columns: `tenant_id`, `migration_name`, `batch`, `applied_at`, `status`.
- **Per-tenant migration state**: Each tenant database has its own `migrations` table. The central ledger aggregates this into a unified view.
- **Drift detection**: Comparing the central ledger with each tenant's actual applied migrations reveals environments where migrations were applied manually or skipped.
- **Version pinning**: A specific schema version can be pinned per tenant, allowing some tenants to stay on an older schema while others advance.

---

# Mental Models

The central schema version ledger is a metadata database that mirrors the `migrations` table of every tenant database. It's the source of truth for "which schema is where" in a multi-tenant deployment.

---

# Internal Mechanics

- The ledger is updated by the migration orchestrator after each per-tenant migration completes.
- If a tenant migration fails, the ledger records the failure status, enabling retry logic.
- Rollback reads the ledger to determine which batch to roll back for which tenant.

---

# Patterns

**Pre-migration check**: Before running migrations on a tenant, check the ledger to determine the tenant's current schema version. Skip tenants already at the target version.

**Post-migration verification**: After migration, compare the ledger with an actual `SELECT * FROM migrations` on the tenant database to detect drift.

**Staggered rollout**: Release migrations in phases: Phase 1 (5% of tenants, internal), Phase 2 (25%, early adopters), Phase 3 (100%). The ledger tracks which tenants are in which phase.

---

# Architectural Decisions

| Feature | When | Complexity |
|---------|------|------------|
| Central ledger | Schema-per-tenant or DB-per-tenant | Medium |
| Drift detection | Any multi-tenant setup with N > 10 | Low |
| | | |

---

# Common Mistakes

**Not tracking schema versions per tenant**: After 6 months, no one knows which tenants are on which schema version. Schema drift becomes unrecoverable.

**Updating ledger before migration succeeds**: If the ledger is updated and the migration fails, the ledger says "migrated" but the tenant database disagrees. Update the ledger only after successful migration.

---

# Related Knowledge Units

1.21 Multi-tenant migration orchestration | 5.19 Schema version ledger per tenant | 5.9 Migration orchestration across tenants

---

# Ecosystem Usage

The schema version ledger pattern is implemented by the stancl/tenancy package in the Laravel ecosystem, which tracks per-tenant migration state in a central `tenants` table. Companies like Spin, Kinsta, and Teamwork maintain custom ledger implementations for their multi-tenant SaaS platforms. The ledger is essential for regulatory compliance (SOC2, HIPAA) where per-tenant schema version tracking is required for audit trails. For large-scale deployments (> 1000 tenants), the central ledger table itself requires indexing and partitioning to handle the volume of migration records efficiently.

# Failure Modes

- **Ledger drift**: The central ledger says a tenant is migrated, but the tenant database's `migrations` table disagrees. This happens when a migration is applied manually outside the orchestrator. Implement periodic ledger-to-tenant reconciliation checks.
- **Race condition on ledger update**: Two orchestrator processes attempt to update the same tenant's ledger entry simultaneously. One overwrites the other's status. Use atomic upsert with version columns or database-level locking.
- **Orphaned ledger entries**: A tenant is deleted but its ledger entries remain. The orchestrator attempts to migrate a non-existent database. Implement soft-delete for tenant records and skip migration for deleted tenants.
- **Ledger corruption**: A partial write to the ledger during an orchestrator crash leaves the entry in an incomplete state. Use transactional writes for ledger updates and implement a recovery scan on orchestrator startup.

# Performance Considerations

- The central ledger table is a hot path — every tenant migration reads and writes to it. For 1000+ tenant deployments, index the ledger on `(tenant_id, batch)`.
- Querying the ledger for "tenants at version X but not Y" runs as a range scan. For 10K+ tenants, this query can take seconds. Consider materialized views or batch processing.
- The ledger update itself is a single row UPSERT — negligible overhead per tenant. The total migration time is dominated by DDL execution, not ledger bookkeeping.
- Use a dedicated database connection for ledger operations to avoid competing with application queries for connection pool resources.

# Production Considerations

- **Ledger backup**: Include the central schema version ledger in backup routines. Losing the ledger after a disaster means losing track of which tenants are at which schema version.
- **Staggered rollout with ledger**: Use the ledger to implement phased rollouts. Mark tenants as "canary," "early-adopter," and "production" in the ledger. The orchestrator only migrates tenants in the current phase.
- **Ledger monitoring**: Alert when a tenant's ledger status shows "migrating" for longer than the expected maximum migration duration. This indicates a stuck or failed migration.
- **Rollback via ledger**: The ledger enables per-tenant rollback. Query the ledger for tenants at the new schema version, then roll back only those tenants. Tenants still at the old version are unaffected.

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Per-tenant schema version visibility | Central ledger adds operational complexity | Requires management of another database table
Enables staggered rollout across tenants | Ledger can become a bottleneck at scale | Indexing and partitioning mitigate this
Simplifies per-tenant rollback | Requires reconciliation with actual migration state | Drift detection needed periodically
Supports canary deployment patterns | Additional write on every migration | Single-row UPSERT, negligible overhead

---

# Research Notes

The schema version ledger is critical operational infrastructure for multi-tenant Laravel applications with per-tenant databases. Without it, schema drift accumulates silently. The stancl/tenancy package handles ledger tracking internally, but custom implementations offer more flexibility for staggered rollouts.
