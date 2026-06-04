# 1-22 Migration Version Ledger Per Tenant

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-22 |
| Knowledge Unit Title | Migration Version Ledger Per Tenant |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 1.21 Multi-tenant migration orchestration | 5.19 Schema version ledger per tenant | 5.9 Migration orchestration across tenants |
| Last Updated | 2026-06-02 |

## Overview

In multi-tenant environments with per-tenant databases, each tenant's schema version must be tracked independently. A central `schema_versions` table (or equivalent) in the control database records which migrations have been applied to which tenant. This enables per-tenant rollbacks, staggered rollouts, canary testing, and schema drift detection.

---

## Core Concepts

- **Schema version ledger**: A table in the central database with columns: `tenant_id`, `migration_name`, `batch`, `applied_at`, `status`.
- **Per-tenant migration state**: Each tenant database has its own `migrations` table. The central ledger aggregates this into a unified view.
- **Drift detection**: Comparing the central ledger with each tenant's actual applied migrations reveals environments where migrations were applied manually or skipped.
- **Version pinning**: A specific schema version can be pinned per tenant, allowing some tenants to stay on an older schema while others advance.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Pre-migration check**: Before running migrations on a tenant, check the ledger to determine the tenant's current schema version. Skip tenants already at the target version.
- **Post-migration verification**: After migration, compare the ledger with an actual `SELECT * FROM migrations` on the tenant database to detect drift.
- **Staggered rollout**: Release migrations in phases: Phase 1 (5% of tenants, internal), Phase 2 (25%, early adopters), Phase 3 (100%). The ledger tracks which tenants are in which phase.


## Architecture Guidelines

- | Feature | When | Complexity |
- |---------|------|------------|
- | Central ledger | Schema-per-tenant or DB-per-tenant | Medium |
- | Drift detection | Any multi-tenant setup with N > 10 | Low |
- | | | |


## Performance Considerations

- - The central ledger table is a hot path — every tenant migration reads and writes to it. For 1000+ tenant deployments, index the ledger on `(tenant_id, batch)`.
- - Querying the ledger for "tenants at version X but not Y" runs as a range scan. For 10K+ tenants, this query can take seconds. Consider materialized views or batch processing.
- - The ledger update itself is a single row UPSERT — negligible overhead per tenant. The total migration time is dominated by DDL execution, not ledger bookkeeping.
- - Use a dedicated database connection for ledger operations to avoid competing with application queries for connection pool resources.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Not tracking schema versions per tenant**: After 6 months, no one knows which tenants are on which schema version. Schema drift becomes unrecoverable. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Updating ledger before migration succeeds**: If the ledger is updated and the migration fails, the ledger says "migrated" but the tenant database disagrees. Update the ledger only after successful migration. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Ledger drift**: The central ledger says a tenant is migrated, but the tenant database's `migrations` table disagrees. This happens when a migration is applied manually outside the orchestrator. Implement periodic ledger-to-tenant reconciliation checks.
- - **Race condition on ledger update**: Two orchestrator processes attempt to update the same tenant's ledger entry simultaneously. One overwrites the other's status. Use atomic upsert with version columns or database-level locking.
- - **Orphaned ledger entries**: A tenant is deleted but its ledger entries remain. The orchestrator attempts to migrate a non-existent database. Implement soft-delete for tenant records and skip migration for deleted tenants.
- - **Ledger corruption**: A partial write to the ledger during an orchestrator crash leaves the entry in an incomplete state. Use transactional writes for ledger updates and implement a recovery scan on orchestrator startup.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

