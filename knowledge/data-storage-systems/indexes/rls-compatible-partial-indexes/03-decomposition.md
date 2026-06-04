# Decomposition: 3.30 RLS-compatible partial indexes (index WHERE matches policy USING)

## Topic Overview
PostgreSQL Row-Level Security (RLS) policies can cause expensive post-scan filters when indexes don't align with policy `USING` expressions. Creating partial indexes that match the RLS policy's `USING` clause enables the index to pre-filter rows before the policy is evaluated, preventing full table scans.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-30-rls-compatible-partial-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.30 RLS-compatible partial indexes (index WHERE matches policy USING)
- **Purpose:** PostgreSQL Row-Level Security (RLS) policies can cause expensive post-scan filters when indexes don't align with policy `USING` expressions. Creating partial indexes that match the RLS policy's `USING` clause enables the index to pre-filter rows before the policy is evaluated, preventing full table scans.
- **Difficulty:** Advanced
- **Dependencies:** 5.14 PostgreSQL RLS, 12.19 Row-Level Security, 12.21 RLS-compatible index design

## Dependency Graph
**Depends on:** "5.14 PostgreSQL RLS", "12.19 Row-Level Security", "12.21 RLS-compatible index design"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Policy alignment**: If RLS policy is `USING (tenant_id = current_setting('app.tenant_id')::bigint)`, a partial index `WHERE tenant_id = current_setting('app.tenant_id')::bigint` allows the planner to use the index for policy evaluation.; - **FORCE ROW LEVEL SECURITY**: Required to prevent table owner bypass. Without it, the table owner's queries skip RLS.; - **Partition propagation**: RLS policies on partitioned tables must be propagated to each partition..
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