# Decomposition: 8.17 Partition-aware Row-Level Security (PostgreSQL)

## Topic Overview
PostgreSQL supports RLS policies on partitioned tables. RLS policies defined on the parent table automatically apply to all partitions. Partition pruning respects RLS — PostgreSQL prunes partitions first, then applies RLS.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-17-partition-aware-rls/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.17 Partition-aware Row-Level Security (PostgreSQL)
- **Purpose:** PostgreSQL supports RLS policies on partitioned tables. RLS policies defined on the parent table automatically apply to all partitions.
- **Difficulty:** Advanced
- **Dependencies:** 5.14 PostgreSQL RLS, 8.5 Partition pruning

## Dependency Graph
**Depends on:** "5.14 PostgreSQL RLS", "8.5 Partition pruning"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **RLS propagation**: `CREATE POLICY tenant_policy ON orders USING (tenant_id = current_setting('app.tenant_id')::int)` — applies to all partitions of `orders`.; - **Partition pruning with RLS**: PostgreSQL prunes partitions using the partition key before evaluating RLS. A user querying `WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'` scans only January 2024 partition, then RLS filters tenant.; - **Performance**: RLS does not prevent partition pruning. Pruning operates on the partition key, RLS operates on the partition's rows..
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