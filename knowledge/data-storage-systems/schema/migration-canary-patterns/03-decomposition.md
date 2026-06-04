# Decomposition: 11.15 Migration canary patterns (run migration on small subset first)

## Topic Overview
Canary migration: apply schema changes to a small subset of production traffic first. For multi-tenant: apply to internal tenants → low-usage tenants → high-usage tenants. For single-database: run on a read replica first, promote if successful.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-15-migration-canary-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.15 Migration canary patterns (run migration on small subset first)
- **Purpose:** Canary migration: apply schema changes to a small subset of production traffic first. For multi-tenant: apply to internal tenants → low-usage tenants → high-usage tenants.
- **Difficulty:** Advanced
- **Dependencies:** 5.29 Tenant migration canary, 11.16 Testing migrations in CI

## Dependency Graph
**Depends on:** "5.29 Tenant migration canary", "11.16 Testing migrations in CI"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Multi-tenant canary**: Apply migration to 1% of tenants (internal/test tenants). Monitor for 15 minutes. If no errors, apply to 10%. Then 50%. Then 100%.; - **Replica canary**: Run migration on a read replica first. Verify schema, performance, and data integrity. Then run on primary during maintenance window.; - **Canary metrics**: Error rate (5xx, query exceptions), latency (P50/P99), replication lag, deadlock rate..
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