# Decomposition: 5.17 Tenant segmentation (grouped tiers, graduated isolation)

## Topic Overview
Tenant segmentation groups tenants into tiers based on usage, revenue, or requirements. Each tier uses a different isolation model: free tier on shared-table, growth tier on schema-per-tenant, enterprise on dedicated databases. Tier assignment is dynamic — tenants can be promoted as they grow.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-17-tenant-segmentation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.17 Tenant segmentation (grouped tiers, graduated isolation)
- **Purpose:** Tenant segmentation groups tenants into tiers based on usage, revenue, or requirements. Each tier uses a different isolation model: free tier on shared-table, growth tier on schema-per-tenant, enterprise on dedicated databases.
- **Difficulty:** Advanced
- **Dependencies:** 5.3 DB-per-tenant, 5.16 Per-tenant scaling

## Dependency Graph
**Depends on:** "5.3 DB-per-tenant", "5.16 Per-tenant scaling"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Tier-based isolation**: Free (shared-table, rate limited) → Pro (schema-per-tenant, higher limits) → Enterprise (DB-per-tenant, dedicated server).; - **Graduated isolation**: A tenant that stays within usage limits stays on shared infrastructure. Above 2x median → isolated. Above 10x → dedicated.; - **Tier assignment rules**: Based on monthly active users, storage used, API requests per day, or subscription plan..
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