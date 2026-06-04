# Decomposition: 5.16 Per-tenant scaling (whale tenants on dedicated resources)

## Topic Overview
Whale tenants (high-usage tenants) outgrow shared infrastructure and require dedicated resources. Scaling strategies: move tenant to a dedicated database server, dedicated schema with higher IOPS, dedicated queue worker, dedicated cache instance. Automated detection + migration pipeline prevents manual intervention for each whale tenant.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-16-per-tenant-scaling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.16 Per-tenant scaling (whale tenants on dedicated resources)
- **Purpose:** Whale tenants (high-usage tenants) outgrow shared infrastructure and require dedicated resources. Scaling strategies: move tenant to a dedicated database server, dedicated schema with higher IOPS, dedicated queue worker, dedicated cache instance.
- **Difficulty:** Advanced
- **Dependencies:** 5.15 Noisy neighbor, 5.17 Tenant segmentation

## Dependency Graph
**Depends on:** "5.15 Noisy neighbor", "5.17 Tenant segmentation"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Whale detection**: Monitor per-tenant storage, query volume, IOPS, connection count. Flag tenants exceeding 2-3x platform median.; - **Isolation escalation path**: Shared-table → dedicated schema → dedicated DB server → dedicated server cluster.; - **Migration impact**: Moving a tenant to dedicated resources requires downtime or replication setup. Schedule during low-usage windows..
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