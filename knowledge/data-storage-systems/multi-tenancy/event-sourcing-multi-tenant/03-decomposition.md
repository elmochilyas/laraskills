# Decomposition: 5.26 Event sourcing in multi-tenant contexts (per-tenant event streams)

## Topic Overview
Event sourcing in multi-tenant systems requires per-tenant event streams. Each tenant's events are isolated — either in separate tables, separate schemas, or tagged with tenant_id in a shared event store. Projections must be tenant-aware.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-26-event-sourcing-multi-tenant/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.26 Event sourcing in multi-tenant contexts (per-tenant event streams)
- **Purpose:** Event sourcing in multi-tenant systems requires per-tenant event streams. Each tenant's events are isolated — either in separate tables, separate schemas, or tagged with tenant_id in a shared event store.
- **Difficulty:** Advanced
- **Dependencies:** 14.1 Event store, 14.6 Projection building

## Dependency Graph
**Depends on:** "14.1 Event store", "14.6 Projection building"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shared event store with tenant_id**: Single `stored_events` table partitioned by `tenant_id`. Most practical. Queries always filter by tenant.; - **Per-tenant event store**: Separate event store schema/database per tenant. Strongest isolation. Most complex projection management.; - **Tenant-scoped projections**: Projection rebuild scoped to one tenant's events. Not the entire event store..
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