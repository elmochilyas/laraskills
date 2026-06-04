# Decomposition: 1.21 Multi-tenant migration orchestration (per-tenant DB, sequential/parallel, queued)

## Topic Overview
In multi-tenant architectures with per-tenant databases, running migrations requires fan-out across potentially hundreds or thousands of databases. Orchestration strategies include sequential (one tenant at a time), parallel (batch concurrency), and queued (each tenant's migration as a job). The choice determines total migration time, resource usage, and failure handling complexity.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-21-multi-tenant-migration-orchestration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.21 Multi-tenant migration orchestration (per-tenant DB, sequential/parallel, queued)
- **Purpose:** In multi-tenant architectures with per-tenant databases, running migrations requires fan-out across potentially hundreds or thousands of databases. Orchestration strategies include sequential (one tenant at a time), parallel (batch concurrency), and queued (each tenant's migration as a job).
- **Difficulty:** Advanced
- **Dependencies:** 5.9 Migration orchestration across tenants, 5.19 Schema version ledger per tenant, 5.29 Tenant migration canary rollout

## Dependency Graph
**Depends on:** "5.9 Migration orchestration across tenants", "5.19 Schema version ledger per tenant", "5.29 Tenant migration canary rollout"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Fan-out problem**: A single `php artisan migrate` applies to one database. With N tenant databases, the migration must run N times.; - **Sequential fan-out**: Loop through tenants, run migration on each. Total time = N * time_per_migration. Simple but slow for 1000+ tenants.; - **Parallel fan-out**: Run migrations on multiple tenants concurrently. Batch size limits concurrency. Faster but requires connection pool management.; - **Queued fan-out**: Each tenant's migration is a separate queue job. Workers process tenant migrations in parallel. Includes built-in retry and failure handling.; - **Canary rollout**: Migrate a subset of tenants (1-5%) first, verify, then roll out to all tenants..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization