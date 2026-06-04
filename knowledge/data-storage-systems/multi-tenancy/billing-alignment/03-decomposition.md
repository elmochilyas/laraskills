# Decomposition: 5.21 Billing alignment with isolation model (DB-per-tenant for spend correlation)

## Topic Overview
Billing alignment means resource costs are attributable to specific tenants. DB-per-tenant provides the clearest correlation: each database's CPU, IOPS, storage, and connection count map directly to a tenant. Shared-table requires estimated cost allocation via usage metrics (row count, query count, storage bytes).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-21-billing-alignment/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.21 Billing alignment with isolation model (DB-per-tenant for spend correlation)
- **Purpose:** Billing alignment means resource costs are attributable to specific tenants. DB-per-tenant provides the clearest correlation: each database's CPU, IOPS, storage, and connection count map directly to a tenant.
- **Difficulty:** Advanced
- **Dependencies:** 5.3 DB-per-tenant, 5.17 Tenant segmentation

## Dependency Graph
**Depends on:** "5.3 DB-per-tenant", "5.17 Tenant segmentation"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Direct attribution (DB-per-tenant)**: Monitor per-database metrics (RDS CloudWatch DBPerfInsights). Costs map 1:1 to tenants. Precise billing.; - **Estimated attribution (shared-table)**: Proxy by storage (bytes per tenant), query count per tenant, API requests. Less precise but sufficient for tiered pricing.; - **Usage metering**: Track per-tenant API requests, storage used, compute time. Bill above plan limits..
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