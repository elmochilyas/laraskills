# Decomposition: 8.2 List partitioning (BY LIST, list of values per partition)

## Topic Overview
List partitioning assigns rows to partitions based on a discrete value list. `PARTITION BY LIST (status) (PARTITION p_active VALUES IN ('active', 'pending'), PARTITION p_inactive VALUES IN ('inactive', 'deleted'))`. Useful for partitioning by category, region, status — columns with a small set of known values.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-2-list-partitioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.2 List partitioning (BY LIST, list of values per partition)
- **Purpose:** List partitioning assigns rows to partitions based on a discrete value list. `PARTITION BY LIST (status) (PARTITION p_active VALUES IN ('active', 'pending'), PARTITION p_inactive VALUES IN ('inactive', 'deleted'))`.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.3 Hash partitioning, 8.13 Default partition

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.3 Hash partitioning", "8.13 Default partition"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Explicit value list**: Each partition specifies which values belong. `VALUES IN ('value1', 'value2')`.; - **Default partition**: `PARTITION p_other VALUES IN (DEFAULT)` — catches unmatched values. Use with caution (can grow unbounded).; - **No range overlap**: A row's value must match exactly one partition's list..
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