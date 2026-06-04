# Decomposition: 5.15 Noisy neighbor detection and mitigation (tenant-level rate limiting, resource quotas)

## Topic Overview
Noisy neighbors are tenants consuming disproportionate resources (CPU, IOPS, memory, connections), degrading performance for other tenants on shared infrastructure. Detection requires per-tenant resource monitoring. Mitigation: tenant-level rate limiting, query timeout enforcement, resource quotas, and ultimately isolation escalation (dedicated resources).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-15-noisy-neighbor-detection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.15 Noisy neighbor detection and mitigation (tenant-level rate limiting, resource quotas)
- **Purpose:** Noisy neighbors are tenants consuming disproportionate resources (CPU, IOPS, memory, connections), degrading performance for other tenants on shared infrastructure. Detection requires per-tenant resource monitoring.
- **Difficulty:** Advanced
- **Dependencies:** 5.1 Shared-table, 5.16 Per-tenant scaling

## Dependency Graph
**Depends on:** "5.1 Shared-table", "5.16 Per-tenant scaling"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Detection signals**: Per-tenant CPU, IOPS, connection count, query count per second, slow query count, response time deviation from platform average.; - **Mitigation tiers**: Rate limiting → query timeout → resource quota → dedicated instance → schema/DB-per-tenant.; - **Resource quota**: Max connections per tenant, max concurrent queries, max storage, max API requests per minute..
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